// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
    try {
        const form = await req.formData();
        const file = form.get("file") as File | null;
        if (!file) return NextResponse.json({ error: "Nicio imagine." }, { status: 400 });
        if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Max 5MB." }, { status: 413 });

        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const dataUri = `data:${file.type};base64,${base64}`;

        const result = await cloudinary.uploader.upload(dataUri, {
            folder: "avatars",
            transformation: [{ width: 512, height: 512, crop: "fill", gravity: "auto" }, { fetch_format: "auto", quality: "auto" }],
        });

        return NextResponse.json({ url: result.secure_url });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }
}
