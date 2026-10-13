const DIGIT_WORDS = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
"A-001";
function spellTicketNumber(ticketNumber) {
    const [code = "", digits = ""] = ticketNumber.split("-");
    const spelled = digits
        .split("")
        .map((d) => DIGIT_WORDS[Number(d)] ?? d)
        .join(" ");
    return `${code}, ${spelled}`;
}
export function isSpeechSupported() {
    return "speechSynthesis" in window;
}
function speak(text) {
    if (!isSpeechSupported())
        return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance); // masuk antrian, tidak memotong pengumuman sebelumnya
}
export function speakTicketCall(ticketNumber, serviceName) {
    speak(`Nomor antrian ${spellTicketNumber(ticketNumber)}, silakan menuju ${serviceName}`);
}
/** Dipanggil dari klik tombol: membuka izin suara sekaligus jadi tes. */
export function enableSpeech() {
    speak("Suara pemanggilan antrian aktif");
}
