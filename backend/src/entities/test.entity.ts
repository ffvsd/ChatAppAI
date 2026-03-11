import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('Test')
export class Test {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  name: string;

  @Column()
  number: number;
}