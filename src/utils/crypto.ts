export async function generateDeviceFingerprint(headers: Record<string, string | undefined>): Promise<string> {
    const data = [
        headers['user-agent'] || '',
        headers['accept-language'] || '',
        headers['accept-encoding'] || '',
    ].join('|');

    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
    return Array.from(new Uint8Array(hash), b =>
        b.toString(16).padStart(2, '0')
    ).join('');
}
