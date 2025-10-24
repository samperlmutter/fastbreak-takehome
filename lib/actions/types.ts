/**
 * Standard response type for all server actions
 * Ensures consistent error handling and type safety across the application
 */
export type ActionResponse<T = void> =
  | {
      success: true
      data: T
      message?: string
    }
  | {
      success: false
      error: string
      fieldErrors?: Record<string, string[]>
    }

/**
 * Type for action state that can be used with useFormState
 */
export type ActionState<T = void> = ActionResponse<T> | null
