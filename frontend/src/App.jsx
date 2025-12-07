import { useState, useRef } from "react";

function getRiskInfo(score) {
  if (score >= 70) {
    return {
      color: "#ef4444", // red
      label: "위험",
      description: "사기일 가능성이 높습니다. 계좌 이체, 인증번호 제공 등 금전/보안 관련 행동은 절대 하지 마세요.",
    };
  }
  if (score >= 40) {
    return {
      color: "#f59e0b", // amber
      label: "주의",
      description: "사기 가능성이 있습니다. 상대방 신분을 다시 확인하고, 혼자 결정하지 말고 주변에 상의하세요.",
    };
  }
  return {
    color: "#22c55e", // green
    label: "안전",
    description: "문장만 보면 사기 가능성이 낮습니다. 다만 실제 상황(발신 번호, 요구 내용 등)도 함께 확인하세요.",
  };
}

function App() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);

  // --- 음성 인식 시작 ---
  const handleStartVoice = () => {
    setError("");

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("이 브라우저에서는 Web Speech API가 지원되지 않습니다. (크롬 사용 권장)");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "ko-KR";
    recognition.interimResults = true;
    recognition.continuous = true;

    let finalTranscript = "";

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onerror = (event) => {
      console.error("SpeechRecognition error", event);
      setError("음성 인식 중 오류가 발생했습니다.");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }
      setText(finalTranscript + interimTranscript);
    };

    recognition.start();
  };

  const handleStopVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  };

  // --- 텍스트 분석 ---
  const handleAnalyze = async () => {
    setError("");
    setResult(null);

    if (!text.trim()) {
      setError("먼저 내용을 입력하거나 음성 입력을 사용해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
      setError("서버 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const riskInfo = result ? getRiskInfo(result.risk_score) : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
      }}
    >
      <div
        style={{
          width: 390,
          padding: 20,
          borderRadius: 24,
          background: "#020617",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          border: "1px solid #1e293b",
        }}
      >
        <h1 style={{ fontSize: 20, marginBottom: 4 }}>Voice Phishing Detector</h1>
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>
          전화 통화 내용을 입력하거나 음성으로 말하면 위험도를 계산합니다.
          (현재는 브라우저 음성 인식 사용, 나중에 Whisper로 교체 가능)
        </p>

        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="상대방이 뭐라고 말했는지 그대로 적어보거나, 아래에서 음성 인식을 시작하세요..."
          style={{
            width: "100%",
            resize: "none",
            borderRadius: 12,
            padding: 10,
            border: "1px solid #374151",
            background: "#020617",
            color: "#e5e7eb",
            fontSize: 13,
            outline: "none",
          }}
        />

        {/* 음성 인식 버튼 */}
        <div
          style={{
            marginTop: 8,
            display: "flex",
            gap: 8,
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={listening ? handleStopVoice : handleStartVoice}
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 9999,
              border: "1px solid #4b5563",
              background: listening ? "#dc2626" : "#111827",
              color: "#e5e7eb",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {listening ? "🎙 인식 중… (누르면 종료)" : "🎙 음성 인식 시작"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#f97373",
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            marginTop: 12,
            width: "100%",
            padding: 10,
            borderRadius: 9999,
            border: "none",
            background: loading ? "#4b5563" : "#22c55e",
            color: "#020617",
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "분석 중..." : "위험도 분석하기"}
        </button>

        {/* 결과 카드 */}
        {result && riskInfo && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 16,
              background: "#020617",
              border: "1px solid #1e293b",
            }}
          >
            {/* 상단 타이틀 + 점수 */}
            <div
              style={{
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>위험도</span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                  }}
                >
                  상태:{" "}
                  <span style={{ color: riskInfo.color, fontWeight: 600 }}>
                    {riskInfo.label}
                  </span>
                </span>
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: riskInfo.color }}>
                {result.risk_score} / 100
              </span>
            </div>

            {/* 컬러 바 */}
            <div
              style={{
                height: 10,
                width: "100%",
                borderRadius: 9999,
                background:
                  "linear-gradient(90deg, #22c55e 0%, #facc15 50%, #ef4444 100%)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* 동적인 마스크 바 */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: `${result.risk_score}%`,
                  background: "rgba(15,23,42,0.1)", // 살짝 어둡게 덮어서 '채워지는' 느낌
                  borderRight: "2px solid #e5e7eb",
                }}
              />
            </div>

            {/* 숫자 디테일 */}
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "#9ca3af",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span>• 위험 점수: {result.risk_score.toFixed(0)} / 100</span>
              {"normal_prob" in result && (
                <span>
                  • 정상일 확률:{" "}
                  {(result.normal_prob * 100).toFixed(1)}
                  %
                </span>
              )}
              {"phishing_prob" in result && (
                <span>
                  • 피싱일 확률:{" "}
                  {(result.phishing_prob * 100).toFixed(1)}
                  %
                </span>
              )}
            </div>

            {/* 이유 / 설명 */}
            <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af" }}>
              <div style={{ marginBottom: 4 }}>설명:</div>
              <div style={{ marginBottom: 6 }}>{riskInfo.description}</div>
              <div>
                키워드 기반 분석:{" "}
                {result.detected_keywords &&
                result.detected_keywords.length > 0
                  ? result.detected_keywords.join(", ")
                  : "특별히 위험 키워드는 감지되지 않았습니다."}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
