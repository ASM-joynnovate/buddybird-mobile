import { useState } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

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
import { BirdIcon, TrashIcon } from 'lucide-react-native';
import type Animated from 'react-native-reanimated';
import type { AnimatedRef, AnimatedStyle } from 'react-native-reanimated';

import { PARROT_NAME_LIMIT } from '@/config';
import BirthdatePicker from '@/screens/onboarding/components/birthdate-picker';
import SpeciesPicker from '@/screens/onboarding/components/species-picker';
import { reportError } from '@/services/telemetry/client';
import { isSpeciesId } from '@/utils/species';

import BuddySays from '@/components/buddy-says';
import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import PermissionDialog from '@/components/dialogs/permission-dialog';
import ProfilePhoto from '@/components/profile-photo';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { InlineError } from '@/components/ui/inline-error';
import { ItemGroup } from '@/components/ui/item/group';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';

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
	photoStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
	badgeStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
}

/**
 * 앵무새 정보 입력 컴포넌트
 * @param parrot 수정할 앵무새
 * @param canDelete 앵무새 삭제 가능 여부
 * @param intro 안내 말풍선 표시 여부
 * @param onBack 뒤로 가기 버튼을 누를 때 실행할 함수
 * @param onDone 편집 완료 시 실행할 함수
 * @param photoRef 원형 사진의 화면 위치를 잴 때 쓰는 ref
 * @param photoStyle 원형 사진에 더할 애니메이션 스타일
 * @param badgeStyle 사진 아이콘 버튼에 더할 애니메이션 스타일
 */
const ParrotEditorForm = ({ parrot, canDelete, intro, onBack, onDone, photoRef, photoStyle, badgeStyle }: Props) => {
	const { t } = useTranslation();

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

	const deleteButton =
		parrot && canDelete ? (
			<IconButton
				icon={TrashIcon}
				label={t('parrot.delete')}
				disabled={saving}
				onPress={() => setDeleteDialogOpen(true)}
			/>
		) : undefined;

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
		<Screen
			footer={
				<>
					<InlineError message={saveError} />
					<Button
						label={t(parrot ? 'common.save' : 'parrot.register')}
						disabled={!requiredFilled}
						loading={saving}
						onPress={handleSave}
					/>
				</>
			}
		>
			<ScreenHeader
				title={t(parrot ? 'parrot.editTitle' : 'parrot.addTitle')}
				onBack={onBack}
				trailing={deleteButton}
			/>

			{intro && (
				<View style={styles.introContainer}>
					<BuddySays message={t('parrot.intro')} />
				</View>
			)}

			<View style={styles.photoContainer}>
				<ProfilePhoto
					photo={photo}
					busy={saving}
					action={photo.photoUri ? 'edit' : 'plus'}
					photoRef={photoRef}
					photoStyle={photoStyle}
					badgeStyle={badgeStyle}
					placeholderIcon={BirdIcon}
				/>
			</View>

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
						<SpeciesPicker first species={species} onChange={handleChangeSpecies} disabled={saving} />
						<BirthdatePicker value={birthdate} onChange={handleChangeBirthdate} />
					</ItemGroup>
					<InlineError message={speciesError} />
					<InlineError message={birthdateError} />
				</View>
			</View>

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
		</Screen>
	);
};

const styles = StyleSheet.create({
	photoContainer: { flexGrow: 1, justifyContent: 'center' },
	introContainer: { marginTop: 4 },
	fieldsContainer: { gap: 16 },
});

export default ParrotEditorForm;
