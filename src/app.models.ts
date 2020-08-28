import { Column, Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  userName: string;

  @Column('varchar')
  password: string;

  @Column('text', { nullable: true })
  token: string;
}

@Entity()
export class UserDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { unique: true })
  emailId: string;

  @Column('varchar')
  fullName: string;

  @Column('text')
  address: string;

  @Column('timestamp')
  activityLog: string;

  @Column('date')
  dateOfBirth: string;
}

@Entity()
export class JobProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  title: string;

  @ManyToOne(type => UserDetail)
  userDetail: UserDetail;
}

@Entity()
export class DuplicateUserDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  emailId: string;

  @Column('varchar')
  fullName: string;

  @Column('text')
  address: string;

  @Column('timestamp')
  activityLog: string;

  @Column('date')
  dateOfBirth: string;

  @ManyToOne(type => UserDetail)
  userDetail: UserDetail;
}
