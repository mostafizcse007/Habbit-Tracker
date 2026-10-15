import { ImageResponse } from "next/og"
import { APP_NAME, APP_TAGLINE } from "@/lib/brand"

export const alt = `${APP_NAME} - ${APP_TAGLINE}`

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

const SHEET_ROWS = [
  { color: "#F97316", marks: "DDDDDDD" },
  { color: "#3B82F6", marks: "DDMDDDD" },
  { color: "#10B981", marks: "D-DD-DD" },
  { color: "#8B5CF6", marks: "DDD--MD" },
]

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#15181D",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "72px 84px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            width: "540px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <svg
              width="72"
              height="72"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="20" height="20" rx="4.4" fill="#15181D" />
              <path
                d="M4.5 10.5l3.5 3.5 7.5-8"
                stroke="#FFE45C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                color: "#F3F4F1",
                fontSize: 36,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              {APP_NAME}
            </span>
          </div>

          <div
            style={{
              color: "#F3F4F1",
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {APP_TAGLINE}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "-8px",
              top: "-10px",
              bottom: "-10px",
              width: "72px",
              borderRadius: "16px",
              backgroundColor: "rgba(255,228,92,0.18)",
            }}
          />
          {SHEET_ROWS.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "10px",
              }}
            >
              {Array.from(row.marks).map((mark, colIndex) => {
                if (mark === "D") {
                  return (
                    <div
                      key={colIndex}
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "12px",
                        backgroundColor: row.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4.5 10.5l3.5 3.5 7.5-8"
                          stroke="#15181D"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )
                }

                if (mark === "M") {
                  return (
                    <div
                      key={colIndex}
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "12px",
                        border: "2px solid rgba(243,244,241,0.25)",
                        display: "flex",
                      }}
                    />
                  )
                }

                return (
                  <div
                    key={colIndex}
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "3px",
                        borderRadius: "2px",
                        backgroundColor: "rgba(243,244,241,0.25)",
                      }}
                    />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
