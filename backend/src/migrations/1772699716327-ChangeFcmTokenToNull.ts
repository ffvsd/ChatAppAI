import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeFcmTokenToNull1772699716327 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE users SET "fcmToken" = NULL WHERE "fcmToken" = ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
