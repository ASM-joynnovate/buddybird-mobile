import { useState } from 'react';

import { StatusBar, StyleSheet, View } from 'react-native';

import { ApiError } from '@/types/apis/common';
import type { Parrot } from '@/types/apis/parrots';

import {
	useCreateParrot,
	useDeleteParrot,
	useDeleteParrotPhoto,
	useUpdateParrot,
	useUploadParrotPhoto,
} from '@/hooks/apis/parrots';
import usePhotoPicker from '@/hooks/use-photo-picker';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import { randomUUID } from 'expo-crypto';
import { ChevronLeftIcon, TrashIcon } from 'lucide-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { type AnimatedRef, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PARROT_NAME_LIMIT } from '@/config';
import BirthdatePicker from '@/screens/onboarding/components/birthdate-picker';
import ParrotPhotoBackdrop from '@/screens/onboarding/components/parrot-photo-backdrop';
import type { ParrotPhotoFlightParts } from '@/screens/onboarding/components/parrot-photo-flight';
import SpeciesPicker from '@/screens/onboarding/components/species-picker';
import { reportError } from '@/services/telemetry/client';
import { colors, contentMaxWidth, radius } from '@/theme';
import { isSpeciesId } from '@/utils/species';

import BuddySays from '@/components/buddy-says';
import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import PermissionDialog from '@/components/dialogs/permission-dialog';
import { Button } from '@/components/ui/button';
import { InlineError } from '@/components/ui/inline-error';
import { ItemGroup } from '@/components/ui/item/group';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';
import { TextField } from '@/components/ui/text-field';
import { Title } from '@/components/ui/title';

const KEYBOARD_BOTTOM_OFFSET = 36;

interface InvalidFields {
	name: boolean;
	species: boolean;
	birthdate: boolean;
}

interface Props {
	parrot?: Parrot;
	canDelete: boolean;
	intro: boolean;
	onBack?: () => void;
	onDone: () => void;
	photoRef?: AnimatedRef<Animated.View>;
	flight?: ParrotPhotoFlightParts;
}

/**
 * 앵무새 정보 입력 컴포넌트
 * @param parrot 수정할 앵무새
 * @param canDelete 앵무새 삭제 가능 여부
 * @param intro 안내 말풍선 표시 여부
 * @param onBack 뒤로 가기 버튼을 누를 때 실행할 함수
 * @param onDone 편집 완료 시 실행할 함수
 * @param photoRef 사진의 화면 위치를 잴 때 쓰는 ref
 * @param flight 사진이 옮겨 가는 애니메이션
 */
const ParrotEditorForm = ({ parrot, canDelete, intro, onBack, onDone, photoRef, flight }: Props) => {
	const { t } = useTranslation();

	const insets = useSafeAreaInsets();

	const scrollY = useSharedValue(0);

	const [name, setName] = useState(parrot?.name ?? '');

	const speciesKnown = parrot ? isSpeciesId(parrot.species) : false;

	const [species, setSpecies] = useState(speciesKnown && parrot ? parrot.species : '');
	const [birthdate, setBirthdate] = useState<string | null | undefined>(parrot?.birthdate);
	const [invalidFields, setInvalidFields] = useState<InvalidFields>({
		name: false,
		species: false,
		birthdate: false,
	});
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [idempotencyKey, setIdempotencyKey] = useState(() => randomUUID());

	const createParrot = useCreateParrot();
	const updateParrot = useUpdateParrot();
	const deleteParrot = useDeleteParrot();
	const uploadParrotPhoto = useUploadParrotPhoto();
	const deleteParrotPhoto = useDeleteParrotPhoto();

	const savedPhotoUrl = parrot?.photo?.url ?? null;

	const photo = usePhotoPicker(savedPhotoUrl);

	const saving =
		createParrot.isPending || updateParrot.isPending || uploadParrotPhoto.isPending || deleteParrotPhoto.isPending;
	const saveError =
		createParrot.isError || updateParrot.isError || uploadParrotPhoto.isError || deleteParrotPhoto.isError
			? t('common.saveErrorKept')
			: null;
	const nameError = invalidFields.name ? t('parrot.nameRequired') : null;
	const speciesError = invalidFields.species ? t('parrot.speciesRequired') : null;
	const birthdateError = invalidFields.birthdate ? t('parrot.birthdateInFuture') : null;
	const requiredFilled = name.trim().length > 0 && isSpeciesId(species) && birthdate !== undefined;
	// 사진이 도착한 뒤에만 상태 표시줄 글자를 밝게 함
	const photoUnderStatusBar = !!photo.photoUri && (flight?.photoLanded ?? true);

	const handleScroll = useAnimatedScrollHandler((event) => {
		scrollY.set(event.contentOffset.y);
	});

	/** 입력 항목의 오류 표시 해제 함수 */
	const clearInvalidField = (field: keyof InvalidFields) => {
		setInvalidFields((prev) => ({ ...prev, [field]: false }));
	};

	/** 변경한 앵무새 사진 저장 함수 */
	const saveParrotPhoto = (savedParrot: Parrot) => {
		if (photo.photoUri && photo.photoUri !== savedPhotoUrl) {
			uploadParrotPhoto.mutate(
				{ id: savedParrot.id, uri: photo.photoUri },
				{ onSuccess: onDone, onError: (error) => reportError(error, 'parrot_save') },
			);
		} else if (!photo.photoUri && savedPhotoUrl) {
			deleteParrotPhoto.mutate(
				{ id: savedParrot.id },
				{ onSuccess: onDone, onError: (error) => reportError(error, 'parrot_save') },
			);
		} else {
			onDone();
		}
	};

	const handleChangeName = (value: string) => {
		setName(value);
		clearInvalidField('name');
	};

	const handleChangeSpecies = (value: string) => {
		setSpecies(value);
		clearInvalidField('species');
	};

	const handleChangeBirthdate = (value: string | null) => {
		setBirthdate(value);
		clearInvalidField('birthdate');
	};

	const handleSave = () => {
		if (saving) {
			return;
		}

		const trimmedName = name.trim();
		const nextInvalidFields = {
			name: trimmedName.length < 1 || trimmedName.length > PARROT_NAME_LIMIT,
			species: !isSpeciesId(species),
			birthdate: dayjs(birthdate).isAfter(dayjs()),
		};

		setInvalidFields(nextInvalidFields);

		if (nextInvalidFields.name || nextInvalidFields.species || nextInvalidFields.birthdate) {
			return;
		}

		const parrotInfo = { name: trimmedName, species, birthdate: birthdate ?? null };

		if (parrot) {
			updateParrot.mutate(
				{ id: parrot.id, data: parrotInfo },
				{ onSuccess: saveParrotPhoto, onError: (error) => reportError(error, 'parrot_save') },
			);

			return;
		}

		createParrot.mutate(
			{ data: parrotInfo, idempotencyKey },
			{
				onSuccess: (savedParrot) => {
					setIdempotencyKey(randomUUID());

					saveParrotPhoto(savedParrot);
				},
				onError: (error) => {
					reportError(error, 'parrot_save');

					if (error instanceof ApiError && error.rejected) {
						setIdempotencyKey(randomUUID());
					}
				},
			},
		);
	};

	const handleDeleteParrot = () => {
		if (deleteParrot.isPending || !parrot) {
			return;
		}

		deleteParrot.mutate(
			{ id: parrot.id },
			{
				onSuccess: () => {
					setDeleteDialogOpen(false);

					onDone();
				},
			},
		);
	};

	const handleCloseDeleteDialog = () => {
		deleteParrot.reset();

		setDeleteDialogOpen(false);
	};

	return (
		<View style={styles.container}>
			<StatusBar barStyle={photoUnderStatusBar ? 'light-content' : 'dark-content'} />

			{flight?.flyingPhoto}

			<KeyboardAwareScrollView
				bounces={false}
				bottomOffset={KEYBOARD_BOTTOM_OFFSET}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
				onScroll={handleScroll}
				contentContainerStyle={styles.scrollContent}
			>
				<ParrotPhotoBackdrop
					photo={photo}
					busy={saving}
					scrollY={scrollY}
					photoRef={photoRef}
					photoStyle={flight?.photoStyle}
					badgeStyle={flight?.buttonsStyle}
				/>

				<Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }, flight?.sheetStyle]}>
					<View style={styles.sheetContent}>
						<Title>{t(parrot ? 'parrot.editTitle' : 'parrot.addTitle')}</Title>

						{intro && <BuddySays message={t('parrot.intro')} />}

						<InlineError message={photo.errorMessage} />

						{/*앵무새 정보 입력*/}
						<View style={styles.fieldsContainer}>
							<TextField
								label={t('parrot.name')}
								errorMessage={nameError}
								value={name}
								onChangeText={handleChangeName}
								editable={!saving}
								maxLength={PARROT_NAME_LIMIT}
								placeholder={t('parrot.nameHint')}
								returnKeyType="done"
							/>

							<View>
								<ItemGroup>
									<SpeciesPicker
										first
										species={species}
										onChange={handleChangeSpecies}
										disabled={saving}
									/>
									<BirthdatePicker value={birthdate} onChange={handleChangeBirthdate} />
								</ItemGroup>
								<InlineError message={speciesError} />
								<InlineError message={birthdateError} />
							</View>
						</View>

						<View style={styles.footerContainer}>
							<InlineError message={saveError} />
							<Button
								label={t(parrot ? 'common.save' : 'parrot.register')}
								disabled={!requiredFilled}
								loading={saving}
								onPress={handleSave}
							/>
						</View>
					</View>
				</Animated.View>
			</KeyboardAwareScrollView>

			{/*사진 위에 떠 있는 버튼*/}
			<Animated.View
				pointerEvents="box-none"
				style={[styles.photoButtons, { top: insets.top + 4 }, flight?.buttonsStyle]}
			>
				{onBack && (
					<PressableSurface
						accessibilityLabel={t('common.back')}
						depth="low"
						cornerRadius="pill"
						onPress={onBack}
						contentStyle={styles.photoButton}
					>
						<ChevronLeftIcon size={24} color={colors.text} />
					</PressableSurface>
				)}
				<View style={styles.photoButtonsSpacer} />
				{parrot && canDelete && (
					<PressableSurface
						accessibilityLabel={t('parrot.delete')}
						disabled={saving}
						depth="low"
						cornerRadius="pill"
						onPress={() => setDeleteDialogOpen(true)}
						contentStyle={styles.photoButton}
					>
						<TrashIcon size={24} color={saving ? colors.subtle : colors.text} />
					</PressableSurface>
				)}
			</Animated.View>

			<PermissionDialog state={photo.libraryDialog} />
			<PermissionDialog state={photo.cameraDialog} />

			{/*앵무새 삭제 확인 다이얼로그*/}
			{parrot && (
				<ConfirmDialog
					visible={deleteDialogOpen}
					text={{
						title: t('common.confirmDelete.title', { name: parrot.name }),
						message: t('common.confirmDelete.message'),
					}}
					confirmStatus={{
						busy: deleteParrot.isPending,
						errorMessage: deleteParrot.isError ? t('parrot.deleteError') : null,
					}}
					onClose={handleCloseDeleteDialog}
					onConfirm={handleDeleteParrot}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1 },
	scrollContent: { flexGrow: 1 },
	sheet: {
		paddingTop: 28,
		paddingHorizontal: 24,
		borderTopLeftRadius: radius.sheet,
		borderTopRightRadius: radius.sheet,
		borderCurve: 'continuous',
		backgroundColor: colors.background,
	},
	sheetContent: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 20 },
	fieldsContainer: { gap: 16 },
	footerContainer: { gap: 8 },
	photoButtons: { position: 'absolute', left: 16, right: 16, flexDirection: 'row' },
	photoButtonsSpacer: { flex: 1 },
	photoButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});

export default ParrotEditorForm;
