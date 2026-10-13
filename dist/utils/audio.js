/**
 * Utilitas Suara Pemanggilan Antrian (Fitur Bonus Praktikum)
 * Menggunakan Web Speech API (window.speechSynthesis), tanpa library eksternal.
 */
const SPEECH_LANG = "id-ID";
const DIGIT_WORDS = {
    "0": "nol",
    "1": "satu",
    "2": "dua",
    "3": "tiga",
    "4": "empat",
    "5": "lima",
    "6": "enam",
    "7": "tujuh",
    "8": "delapan",
    "9": "sembilan",
};
export function isSpeechSupported() {
    return "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}
/**
 * Mengubah nomor tiket menjadi teks yang enak diucapkan.
 * 'A-006' -> 'A, nol nol enam' (digit dibaca satu per satu agar tidak ambigu).
 */
function spellTicketNumber(ticketNumber) {
    const [code = "", digits = ""] = ticketNumber.split("-");
    const spokenDigits = [...digits].map((d) => DIGIT_WORDS[d] ?? d).join(" ");
    return `${code}, ${spokenDigits}`;
}
function pickIndonesianVoice() {
    return window.speechSynthesis
        .getVoices()
        .find((voice) => voice.lang.toLowerCase().replace("_", "-").startsWith("id"));
}
/**
 * Mengucapkan panggilan antrian. Panggilan yang sedang berjalan dihentikan lebih dulu
 * agar suara tidak menumpuk saat operator menekan tombol berkali-kali.
 * Mengembalikan false jika browser tidak mendukung Web Speech API.
 */
export function speakTicketCall(ticketNumber, serviceName) {
    if (!isSpeechSupported())
        return false;
    const text = `Nomor antrian ${spellTicketNumber(ticketNumber)}. Silakan menuju ${serviceName}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LANG;
    utterance.rate = 0.9;
    const voice = pickIndonesianVoice();
    if (voice)
        utterance.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
}
