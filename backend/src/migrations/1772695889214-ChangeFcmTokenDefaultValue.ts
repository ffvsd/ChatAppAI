import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeFcmTokenDefaultValue1772695889214 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE users SET "fcmToken" = '' WHERE "fcmToken" IS NULL`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
