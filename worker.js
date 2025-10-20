export default {
  async fetch(request, env) {
    // Preflight for CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*", // restrict to the site in production
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const reqJson = await request.json();
      const text = (reqJson.text || "").toString();
      const language = (reqJson.language || "French").toString();

      if (!text) {
        return new Response(JSON.stringify({ error: "Missing text" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      // Build a clear translation prompt
      const prompt = `Translate the following text into ${language}. Keep the translation concise and accurate. Preserve named entities and don't add extra explanation.\n\nText: """${text}"""`;

      // Call OpenAI Chat Completions
      const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", 
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 300
        })
      });

      if (!openaiResp.ok) {
        const textErr = await openaiResp.text().catch(() => "");
        return new Response(JSON.stringify({ error: `OpenAI error: ${openaiResp.status} ${openaiResp.statusText}. ${textErr}` }), {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      const openaiData = await openaiResp.json();

      // Defensive parsing
      let translation = "";
      if (openaiData?.choices?.[0]?.message?.content) {
        translation = openaiData.choices[0].message.content;
      } else if (openaiData?.choices?.[0]?.text) {
        translation = openaiData.choices[0].text;
      } else {
        translation = JSON.stringify(openaiData).slice(0, 1000);
      }

      return new Response(JSON.stringify({ translation }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || String(err) }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      });
    }
  }
};
