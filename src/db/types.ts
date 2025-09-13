import type {
	ColumnType,
	Generated,
	Insertable,
	Selectable,
	Updateable,
} from "kysely";

export interface Database {
	users: UsersTable;
	uploads: UploadsTable;
}

export interface UsersTable {
	id: Generated<string>;
	bearer_token: string;
	created_at: Generated<ColumnType<Date, Date, never>>;
}

export interface UploadsTable {
	id: Generated<string>;
	shareable_link: string;
	s3_link: string;
	ttl: Date;
	uploader: string;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export type Upload = Selectable<UploadsTable>;
export type NewUpload = Insertable<UploadsTable>;
export type UploadUpdate = Updateable<UploadsTable>;
