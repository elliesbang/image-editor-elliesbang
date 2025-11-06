import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

/**
 * AWS Bedrock을 이용한 배경제거 함수
 * Stability Diffusion XL 모델을 사용하며, 결과 이미지를 Base64(PNG) 형태로 반환합니다.
 */

const client = new BedrockRuntimeClient({ region: "us-east-1" }); // Bedrock 지원 리전 (us-east-1, us-west-2 등)

export const handler = async (event) => {
  try {
    const { imageBase64 } = JSON.parse(event.body || "{}");

    if (!imageBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "이미지 데이터가 없습니다." }),
      };
    }

    // Bedrock 모델 호출
    const command = new InvokeModelCommand({
      modelId: "stability.stable-diffusion-xl-v1",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        taskType: "imageToImage",
        inputImage: imageBase64,
        prompt:
          "Remove the background cleanly and output the subject with transparent background, keep all edges smooth and natural.",
        imageGenerationConfig: {
          numberOfImages: 1,
          quality: "high",
          cfgScale: 10,
        },
      }),
    });

    const response = await client.send(command);

    // 결과 처리
    const responseBody = new TextDecoder().decode(response.body);
    const parsed = JSON.parse(responseBody);

    // Bedrock은 이미지 데이터를 base64 형태로 반환
    const base64Image =
      parsed?.artifacts?.[0]?.base64 ?? parsed?.images?.[0]?.base64 ?? null;

    if (!base64Image) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Bedrock에서 이미지 데이터가 반환되지 않았습니다.",
          rawResponse: parsed,
        }),
      };
    }

    // 응답 구성
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        image: `data:image/png;base64,${base64Image}`,
      }),
    };
  } catch (error) {
    console.error("Bedrock remove-bg error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
