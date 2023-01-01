import { ObjectType, Field } from "type-graphql";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
    ManyToMany,
    JoinTable,
} from "typeorm";

@ObjectType()
@Entity()
export default class User extends BaseEntity {

    @Field(() => String)
    @PrimaryGeneratedColumn()
    token!: string

    @Field()
    @Column({ unique: true })
    username!: string

    @Column()
    password!: string

    @Field(() => [User], { nullable: true })
    @ManyToMany(() => User)
    followers?: User[]

    @Field(() => [User], { nullable: true })
    @ManyToMany(() => User)
    @JoinTable()
    following?: User[]

    @Field(() => String, { nullable: true })
    @Column({ type: String, nullable: true })
    profilePicUrl?: string
}
