import { ObjectType, Field } from "type-graphql";
import { Entity, Column, BaseEntity, OneToMany, JoinTable, ManyToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import User from "./user.js";
import Message from "./message.js";

@ObjectType()
@Entity()
export default class Chat extends BaseEntity {

    @Field(() => String)
    @PrimaryGeneratedColumn()
    id!: string

    @Field(() => [User])
    @ManyToMany(() => User, (user: User) => user.chats)
    @JoinTable()
    members!: Relation<User[]>

    @Field(() => [Message])
    @OneToMany(() => Message, (message: Message) => message.chat)
    messages!: Relation<Message[]>
}
