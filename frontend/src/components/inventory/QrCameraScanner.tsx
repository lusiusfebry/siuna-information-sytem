import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Modal from '../common/Modal';

interface QrCameraScannerProps {
    isOpen: boolean;
    onClose: () => void;
    /** Dipanggil sekali saat kode berhasil terbaca. Kamera langsung dihentikan setelahnya. */
    onScan: (code: string) => void;
}

// ID elemen host kamera. html5-qrcode memerlukan elemen dengan id, bukan ref langsung.
const REGION_ID = 'qr-camera-region';

/**
 * Scanner kamera QR/barcode berbasis html5-qrcode.
 * - Berjalan di browser HP (Android/iOS Safari) via getUserMedia — wajib HTTPS atau localhost.
 * - Membaca QR dan barcode 1D/2D umum.
 * - Untuk alat scanner fisik (HID keyboard-wedge) tidak perlu komponen ini; cukup field input teks.
 */
const QrCameraScanner = ({ isOpen, onClose, onScan }: QrCameraScannerProps) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannedRef = useRef(false); // cegah pemanggilan onScan ganda dari frame beruntun
    const [error, setError] = useState<string | null>(null);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;
        scannedRef.current = false;
        setError(null);
        setStarting(true);

        const scanner = new Html5Qrcode(REGION_ID, {
            formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.ITF,
            ],
            verbose: false,
        });
        scannerRef.current = scanner;

        const onSuccess = (decodedText: string) => {
            if (scannedRef.current) return;
            scannedRef.current = true;
            // Hentikan kamera sebelum menyerahkan hasil supaya stream benar-benar mati.
            scanner
                .stop()
                .catch(() => { /* sudah berhenti / belum mulai — abaikan */ })
                .finally(() => {
                    scanner.clear();
                    onScan(decodedText);
                });
        };

        // { facingMode: 'environment' } memilih kamera belakang di HP bila tersedia.
        scanner
            .start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 240, height: 240 } },
                onSuccess,
                undefined, // callback error per-frame diabaikan (noise saat belum ada kode)
            )
            .then(() => {
                if (!cancelled) setStarting(false);
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                setStarting(false);
                setError(resolveCameraError(err));
            });

        return () => {
            cancelled = true;
            const s = scannerRef.current;
            scannerRef.current = null;
            if (s) {
                // getState() bisa melempar bila belum sempat mulai; bungkus aman.
                s.stop()
                    .catch(() => { /* belum berjalan — abaikan */ })
                    .finally(() => {
                        try { s.clear(); } catch { /* noop */ }
                    });
            }
        };
    }, [isOpen, onScan]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Scan Kamera" description="Arahkan kamera ke kode QR atau barcode." size="md">
            <div className="space-y-3">
                {starting && !error && (
                    <p className="text-sm text-gray-500 text-center">Memulai kamera...</p>
                )}

                {error ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                        <span className="material-symbols-outlined text-red-400 text-3xl mb-1 block">videocam_off</span>
                        <p className="text-sm text-red-700">{error}</p>
                        <p className="text-xs text-gray-500 mt-2">Anda tetap dapat mengetik atau menempel kode secara manual, atau memakai alat scanner.</p>
                    </div>
                ) : (
                    <div
                        id={REGION_ID}
                        className="w-full overflow-hidden rounded-xl bg-black [&_video]:w-full [&_video]:rounded-xl"
                    />
                )}

                <p className="text-[11px] text-gray-400 text-center">
                    Kamera memerlukan koneksi aman (HTTPS) atau localhost.
                </p>
            </div>
        </Modal>
    );
};

/** Terjemahkan error getUserMedia/html5-qrcode ke pesan ramah berbahasa Indonesia. */
function resolveCameraError(err: unknown): string {
    const name = (err as { name?: string })?.name || '';
    const message = (err as { message?: string })?.message || String(err);

    if (name === 'NotAllowedError' || /permission|denied/i.test(message)) {
        return 'Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser lalu coba lagi.';
    }
    if (name === 'NotFoundError' || /no camera|not found|requested device/i.test(message)) {
        return 'Kamera tidak ditemukan pada perangkat ini.';
    }
    if (name === 'NotReadableError' || /in use|could not start/i.test(message)) {
        return 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.';
    }
    if (/secure context|https/i.test(message)) {
        return 'Kamera hanya berfungsi lewat koneksi aman (HTTPS) atau localhost.';
    }
    return 'Gagal memulai kamera. Coba lagi atau masukkan kode secara manual.';
}

export default QrCameraScanner;
