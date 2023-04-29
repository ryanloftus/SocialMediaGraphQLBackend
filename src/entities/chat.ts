import { ObjectType, Field } from "type-graphql";
import { Entity, Column, BaseEntity, OneToMany, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import User from "./user.js";
import Message from "./message.js";

@ObjectType()
@Entity()
export default class Chat extends BaseEntity {

    @Field()
    @PrimaryGeneratedColumn()
    id!: string

    @Field(() => [User])
    @ManyToMany(() => User, (user) => user.chats)
    @JoinTable()
    members!: User[]

    @Field(() => [Message])
    @OneToMany(() => Message, (message) => message.chat)
    messages!: Message[]
}
