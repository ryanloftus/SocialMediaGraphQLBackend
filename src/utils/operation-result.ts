import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export default class OperationResultResponse {

    @Field()
    didOperationSucceed: boolean

    @Field(() => String, { nullable: true })
    error?: string
}
