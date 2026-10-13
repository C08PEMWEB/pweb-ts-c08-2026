/**
 * Utilitas Suara Pemanggilan Antrian (Fitur Bonus Praktikum)
 * Menggunakan Web Speech API (window.speechSynthesis), tanpa library eksternal.
 */

const SPEECH_LANG = "id-ID";

const DIGIT_WORDS = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];

export function isSpeechSupported(): boolean {
  return "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

/**
 * Mengubah nomor tiket menjadi teks yang enak diucapkan.
 * 'A-006' -> 'A, nol nol enam' (digit dibaca satu per satu agar tidak ambigu).
 */
function spellTicketNumber(ticketNumber: string): string {
  const [code = "", digits = ""] = ticketNumber.split("-");
  const spelled = [...digits].map((d) => DIGIT_WORDS[Number(d)] ?? d).join(" ");
  return `${code}, ${spelled}`;
}

function pickIndonesianVoice(): SpeechSynthesisVoice | undefined {
  return window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.toLowerCase().replace("_", "-").startsWith("id"));
}

/**
 * @param interrupt true: hentikan suara yang sedang berjalan lebih dulu (dipakai Panggil Ulang
 *                  agar tidak menumpuk). false: masuk antrian sehingga tidak memotong
 *                  pengumuman layanan lain.
 */
function speak(text: string, interrupt: boolean): boolean {
  if (!isSpeechSupported()) return false;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = SPEECH_LANG;
  utterance.rate = 0.9;

  const voice = pickIndonesianVoice();
  if (voice) utterance.voice = voice;

  if (interrupt) window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

/** Mengucapkan panggilan antrian. Mengembalikan false jika browser tidak mendukung. */
export function speakTicketCall(ticketNumber: string, serviceName: string, interrupt = false): boolean {
  return speak(`Nomor antrian ${spellTicketNumber(ticketNumber)}. Silakan menuju ${serviceName}.`, interrupt);
}

/** Dipanggil dari klik tombol: membuka izin suara sekaligus jadi tes. */
export function enableSpeech(): void {
  speak("Suara pemanggilan antrian aktif", false);
}
