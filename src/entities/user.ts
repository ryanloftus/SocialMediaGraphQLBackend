import { ObjectType, Field } from "type-graphql";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
    ManyToMany,
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

    @ManyToMany(() => User, (user) => user.following)
    followers: User[]

    @ManyToMany(() => User, (user) => user.followers)
    following: User[]

    @Field(() => String, { nullable: true, defaultValue: null })
    @Column({ type: String, nullable: true })
    profilePicUrl?: string | null
}
