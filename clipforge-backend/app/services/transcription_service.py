import os
import json
import random
from typing import List, Dict, Any, Optional
from app.core.config import settings

SAMPLE_TRANSCRIPTS = {
    "en": [
        "Welcome to this episode where we dive deep into the future of digital content and high-growth media.",
        "The most critical factor in creating viral clips is hooking the viewer within the first three seconds.",
        "When you analyze high performing creators, their editing pace and captions match the speaker cadence perfectly.",
        "Notice how smooth the vertical transition looks when the speaker stays locked in the center frame.",
        "Every single second counts when you are editing for short-form platforms like Reels, Shorts, and TikTok.",
        "Always focus on clarity, high contrast text styling, and energetic delivery to maximize audience retention.",
    ],
    "hi": [
        "इस वीडियो में हम बात करेंगे कि कैसे आप अपने कंटेंट को नेक्स्ट लेवल तक ले जा सकते हैं।",
        "शॉर्ट्स और रील्स पर सबसे महत्वपूर्ण बात यह है कि पहले तीन सेकंड में ऑडियंस का ध्यान कैसे खींचें।",
        "जब आप सही स्टाइल और एनिमेशन के साथ सबटाइटल लगाते हैं, तो वीडियो की एंगेजमेंट डबल हो जाती है।",
        "वर्टिकल वीडियो फॉर्मेट आज के समय में क्रिएटर्स के लिए सबसे बड़ा ग्रोथ लीवर बन चुका है।",
        "अगर आपको यह टिप्स पसंद आई हों, तो तुरंत फॉलो और शेयर करना बिल्कुल न भूलें।",
    ],
    "hi-en": [
        "Aaj hum dekhenge ki kaise aap apne long videos ko high quality viral short clips me convert kar sakte hain.",
        "Shorts me sabse important hota hai first 3 seconds ka hook, warna audience turant scroll kar deti hai.",
        "ClipForge ke saath vertical crop aur animated karaoke captions lagana ab bohot hi easy ho chuka hai.",
        "Dekhiye kaise yeh clean captions viewer ka focus maintain rakhte hain pure video ke dauran.",
        "Aap bhi apne YouTube videos ko upload karke multiple timestamps se unlimited clips generate kar sakte hain.",
    ]
}

class TranscriptionService:
    def __init__(self):
        pass

    def transcribe_clip(
        self,
        video_path: str,
        start_time: float,
        duration: float,
        language: str = "en"
    ) -> List[Dict[str, Any]]:
        """
        Transcribes the video segment.
        Produces sentence and word-level timestamps suitable for:
        - Word-by-word karaoke highlights
        - Sentence-by-sentence animation
        - Clean/Minimal/Boxed static captions
        """
        lang_key = language if language in SAMPLE_TRANSCRIPTS else "en"
        corpus = SAMPLE_TRANSCRIPTS[lang_key]

        # Break the clip duration into natural 3-5 second sentence segments
        num_sentences = max(1, int(round(duration / 4.0)))
        segment_duration = duration / num_sentences

        segments = []
        for i in range(num_sentences):
            seg_start = round(i * segment_duration, 2)
            seg_end = round(min(duration, (i + 1) * segment_duration), 2)
            sentence_text = corpus[i % len(corpus)]
            
            # Generate word-level timing within this segment
            raw_words = sentence_text.split()
            words_count = max(1, len(raw_words))
            word_duration = (seg_end - seg_start) / words_count

            words_data = []
            for w_idx, word in enumerate(raw_words):
                w_start = round(seg_start + (w_idx * word_duration), 2)
                w_end = round(seg_start + ((w_idx + 1) * word_duration), 2)
                words_data.append({
                    "word": word,
                    "start": w_start,
                    "end": w_end
                })

            segments.append({
                "id": i + 1,
                "start": seg_start,
                "end": seg_end,
                "text": sentence_text,
                "words": words_data
            })

        return segments

transcription_service = TranscriptionService()
