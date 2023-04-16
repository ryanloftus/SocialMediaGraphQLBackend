import { ObjectType, Field } from "type-graphql";
import { Entity, Column, BaseEntity, CreateDateColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Chat from "./chat.js";

@ObjectType()
@Entity()
export default class Message extends BaseEntity {

    @Field(() => String)
    @PrimaryGeneratedColumn()
    id!: String

    @Field(() => String)
    @Column()
    text!: String;

    @Field(() => String)
    @CreateDateColumn()
    timestamp!: Date;

    @Field(() => Chat)
    @ManyToOne(() => Chat)
    chat!: Chat
}
