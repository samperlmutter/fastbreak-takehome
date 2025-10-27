import { ZodSchema, ZodError } from 'zod'
import { ActionResponse } from './types'
import { getUser } from '@/lib/supabase/server'

/**
 * Options for creating a server action
 */
interface ActionOptions<TInput, TOutput> {
  /**
   * Zod schema for input validation
   */
  schema?: ZodSchema<TInput>

  /**
   * Whether authentication is required for this action
   * @default true
   */
  requireAuth?: boolean

  /**
   * Optional success message to include in the response
   */
  successMessage?: string

  /**
   * The actual action handler
   */
  handler: (input: TInput, userId?: string) => Promise<TOutput>
}

/**
 * Creates a type-safe server action with consistent error handling
 *
 * Features:
 * - Automatic input validation with Zod
 * - Consistent error response format
 * - Optional authentication requirement
 * - Type-safe throughout
 *
 * @example
 * ```ts
 * const createEventAction = createAction({
 *   schema: createEventSchema,
 *   requireAuth: true,
 *   handler: async (input, userId) => {
 *     // Implementation
 *     return event
 *   }
 * })
 * ```
 */
export function createAction<TInput = void, TOutput = void>(
  options: ActionOptions<TInput, TOutput>
) {
  return async (input: TInput): Promise<ActionResponse<TOutput>> => {
    try {
      // Check authentication if required
      if (options.requireAuth !== false) {
        const user = await getUser()

        if (!user) {
          return {
            success: false,
            error: 'Authentication required. Please log in.',
          }
        }

        // Validate input if schema is provided
        let validatedInput = input
        if (options.schema) {
          try {
            validatedInput = options.schema.parse(input)
          } catch (error) {
            if (error instanceof ZodError) {
              return {
                success: false,
                error: 'Validation failed',
                fieldErrors: error.flatten().fieldErrors as Record<
                  string,
                  string[]
                >,
              }
            }
            throw error
          }
        }

        // Execute the handler with user ID
        const result = await options.handler(validatedInput, user.id)

        // Check if handler returned a custom message
        const isResultWithMessage =
          result &&
          typeof result === 'object' &&
          'data' in result &&
          'message' in result

        if (isResultWithMessage) {
          return {
            success: true,
            data: (result as any).data,
            message: (result as any).message || options.successMessage,
          }
        }

        return {
          success: true,
          data: result,
          ...(options.successMessage && { message: options.successMessage }),
        }
      } else {
        // No auth required - validate and execute
        let validatedInput = input
        if (options.schema) {
          try {
            validatedInput = options.schema.parse(input)
          } catch (error) {
            if (error instanceof ZodError) {
              return {
                success: false,
                error: 'Validation failed',
                fieldErrors: error.flatten().fieldErrors as Record<
                  string,
                  string[]
                >,
              }
            }
            throw error
          }
        }

        const result = await options.handler(validatedInput, undefined)

        // Check if handler returned a custom message
        const isResultWithMessage =
          result &&
          typeof result === 'object' &&
          'data' in result &&
          'message' in result

        if (isResultWithMessage) {
          return {
            success: true,
            data: (result as any).data,
            message: (result as any).message || options.successMessage,
          }
        }

        return {
          success: true,
          data: result,
          ...(options.successMessage && { message: options.successMessage }),
        }
      }
    } catch (error) {
      console.error('Server action error:', error)

      // Handle specific error types
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message || 'An unexpected error occurred',
        }
      }

      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      }
    }
  }
}

/**
 * Helper to create a success response
 */
export function successResponse<T>(
  data: T,
  message?: string
): ActionResponse<T> {
  return {
    success: true,
    data,
    message,
  }
}

/**
 * Helper to create an error response
 */
export function errorResponse(
  error: string,
  fieldErrors?: Record<string, string[]>
): ActionResponse<never> {
  return {
    success: false,
    error,
    fieldErrors,
  }
}
