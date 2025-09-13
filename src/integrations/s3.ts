import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
} from "@aws-sdk/client-s3";

export const BUCKET_URL =
	"https://ejqkxtgweqyvrlvxrwpo.supabase.co/storage/v1/object/public/yeetbox-dev/";

const s3Client = new S3Client({
	endpoint: Bun.env.S3_ENDPOINT_URL as string,
	region: "eu-west-2",
	forcePathStyle: true,
	credentials: {
		accessKeyId: Bun.env.S3_ACCESS_KEY_ID as string,
		secretAccessKey: Bun.env.S3_SECRET_ACCESS_KEY as string,
	},
});

export async function putObject(file: File) {
	const extension = file.name.split(".").pop();
	const s3Key = `${crypto.randomUUID()}.${extension}`;

	const command = new PutObjectCommand({
		Bucket: "yeetbox-dev",
		Key: s3Key,
		Body: new Uint8Array(await file.arrayBuffer()),
		ContentType: file.type,
	});

	const result = await s3Client.send(command);
	return { result, s3Key };
}

export async function getObject(s3String: string) {
	const s3Key = s3String.split("-dev/")[1];
	console.log("extracted key: ", s3Key);
	const command = new GetObjectCommand({
		Bucket: "yeetbox-dev",
		Key: s3Key,
	});
	const result = await s3Client.send(command);
	return result;
}
