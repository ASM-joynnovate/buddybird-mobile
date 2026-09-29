import { useCallback } from 'react';

import { type MutateOptions, type UseMutationOptions, useMutation } from '@tanstack/react-query';

import { randomUUID } from 'expo-crypto';

interface IdempotentVariables {
	idempotencyKey: string;
}

/** 요청마다 새 idempotency key를 넣는 useMutation Hook */
export const useIdempotentMutation = <TData, TError, TVariables extends IdempotentVariables, TContext>(
	options: UseMutationOptions<TData, TError, TVariables, TContext>,
) => {
	const mutation = useMutation(options);

	const { mutate, mutateAsync } = mutation;

	/** 새 idempotency key를 넣은 mutate */
	const mutateWithKey = useCallback(
		(
			variables: Omit<TVariables, 'idempotencyKey'>,
			callbacks?: MutateOptions<TData, TError, TVariables, TContext>,
		) => mutate({ ...variables, idempotencyKey: randomUUID() } as TVariables, callbacks),
		[mutate],
	);

	/** 새 idempotency key를 넣은 mutateAsync */
	const mutateAsyncWithKey = useCallback(
		(
			variables: Omit<TVariables, 'idempotencyKey'>,
			callbacks?: MutateOptions<TData, TError, TVariables, TContext>,
		) => mutateAsync({ ...variables, idempotencyKey: randomUUID() } as TVariables, callbacks),
		[mutateAsync],
	);

	return { ...mutation, mutate: mutateWithKey, mutateAsync: mutateAsyncWithKey };
};
