import { useCallback } from 'react';

import { type MutateOptions, type UseMutationOptions, useMutation } from '@tanstack/react-query';

import { randomUUID } from 'expo-crypto';

type IdempotentVariables = { idempotencyKey: string };

export function useIdempotentMutation<TData, TError, TVariables extends IdempotentVariables, TContext>(
	options: UseMutationOptions<TData, TError, TVariables, TContext>,
) {
	const mutation = useMutation(options);
	const { mutate, mutateAsync } = mutation;

	const mutateWithKey = useCallback(
		(
			variables: Omit<TVariables, 'idempotencyKey'>,
			callbacks?: MutateOptions<TData, TError, TVariables, TContext>,
		) => mutate({ ...variables, idempotencyKey: randomUUID() } as TVariables, callbacks),
		[mutate],
	);

	const mutateAsyncWithKey = useCallback(
		(
			variables: Omit<TVariables, 'idempotencyKey'>,
			callbacks?: MutateOptions<TData, TError, TVariables, TContext>,
		) => mutateAsync({ ...variables, idempotencyKey: randomUUID() } as TVariables, callbacks),
		[mutateAsync],
	);

	return { ...mutation, mutate: mutateWithKey, mutateAsync: mutateAsyncWithKey };
}
