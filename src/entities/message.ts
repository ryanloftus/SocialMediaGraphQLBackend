import { ObjectType, Field } from "type-graphql";
import { Entity, Column, BaseEntity, CreateDateColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Chat from "./chat.js";
import User from "./user.js";

@ObjectType()
@Entity()
export default class Message extends BaseEntity {

    @Field(() => String)
    @PrimaryGeneratedColumn()
    id!: string;

    @Field(() => String)
    @Column()
    text!: string;

    @Field(() => User)
    @ManyToOne(() => User)
    sender!: User

    @Field(() => String)
    @CreateDateColumn()
    timestamp!: Date;

    @Field(() => Chat)
    @ManyToOne(() => Chat, (chat) => chat.messages)
    chat!: Chat;
}
