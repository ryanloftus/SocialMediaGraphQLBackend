import { ObjectType, Field } from "type-graphql";
import { Entity, Column, BaseEntity, CreateDateColumn, OneToMany, OneToOne } from "typeorm";
import User from "./user.js";
import Message from "./message.js";

@ObjectType()
@Entity()
export default class Chat extends BaseEntity {

    @Field()
    @OneToOne(() => User)
    to!: User

    @Field()
    @OneToOne(() => User)
    from!: User

    @Field()
    @OneToMany(() => Message, (message) => message.chat)
    messages!: Message[]
}
