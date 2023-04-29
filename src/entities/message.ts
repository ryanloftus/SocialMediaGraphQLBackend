import { ObjectType, Field } from "type-graphql";
import { Entity, Column, BaseEntity, CreateDateColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
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
    sender!: Relation<User>

    @Field(() => String)
    @CreateDateColumn()
    timestamp!: Date;

    @Field(() => Chat)
    @ManyToOne(() => Chat)
    chat!: Relation<Chat>;
}
