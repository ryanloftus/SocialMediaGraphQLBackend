import { Field, ObjectType } from 'type-graphql'
import FieldError from './field-error'

@ObjectType()
export default class OperationResultResponse {

    @Field()
    didOperationSucceed: boolean

    @Field()
    errors?: FieldError[]
}
