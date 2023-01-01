import { Field, ObjectType } from 'type-graphql'
import FieldError from './field-error.js'

@ObjectType()
export default class OperationResultResponse {

    @Field()
    didOperationSucceed: boolean

    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[]
}
