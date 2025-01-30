import { useRef, useState, useEffect } from "react";
import { TbPhotoUp, TbPhotoDown, TbPhotoX } from "react-icons/tb";
import {
  Stack,
  Image as MantineImage,
  Paper,
  Group,
  Text,
  Select,
  Button,
  Spoiler,
  Flex,
  Skeleton,
} from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { RadarChart } from "@mantine/charts";

export default function DropzoneButton() {
  const defaultText =
    "Once the image is uploaded and the action is selected, the content here will display the results. If you choose 'Handwriting Parser,' it will analyze the text in the image and provide the recognized characters. With 'Caption Generator,' a description of the image will be generated. For 'Object Detection,' detected objects within the image will be listed here.";
  const openRef = useRef(null);
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [action, setAction] = useState(null);
  const [result, setResult] = useState(null);
  const initalChartData = [
    { label: "happy", score: 0 },
    { label: "neutral", score: 0 },
    { label: "surprise", score: 0 },
    { label: "sad", score: 0 },
    { label: "fear", score: 0 },
  ];
  const [chartData, setChartData] = useState(initalChartData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  async function performAction() {
    if (!file) {
      setError("Please select an image to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    setError("");
    setResult("");

    try {
      const response = await fetch(`http://127.0.0.1:5000/${action.value}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      switch (action.value) {
        case "generate-ocr":
          setResult(`${data[0].generated_text}`);
          break;
        case "generate-caption":
          setResult(`${data[0].generated_text}`);
          break;
        case "detect-obj":
          setResult(JSON.stringify(data));
          break;
        case "detect-emo":
          setResult(JSON.stringify(data));
          setChartData(data.map((d) => ({ ...d, score: d.score * 100 })));
        default:
          setResult(JSON.stringify(data));
      }
    } catch (error) {
      setError("Error generating caption. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (
      action?.value === "detect-obj" &&
      result &&
      canvasRef.current &&
      image
    ) {
      console.log("useeffect");
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);

        // Draw bounding boxes
        JSON.parse(result).forEach((obj) => {
          const { xmin, ymin, xmax, ymax } = obj.box;
          context.strokeStyle = "red";
          context.lineWidth = 2;
          context.strokeRect(xmin, ymin, xmax - xmin, ymax - ymin);

          const fontSize = Math.max(canvas.height * 0.06, 16);
          context.font = `${fontSize}px Arial`;

          const text = `${obj.label} (${(obj.score * 100).toFixed(1)}%)`;
          const textHeight = fontSize * 1.2;
          let labelY = ymin <= 10 ? ymax + textHeight + 4 : ymin - 5;

          // Draw background rectangle behind the text
          context.fillStyle = "rgba(0, 0, 0, 0.7)"; // Semi-transparent background
          context.fillRect(
            xmin, // X position of the background
            labelY - textHeight, // Y position (adjusted for padding)
            context.measureText(text).width + 6, // Width with some padding
            textHeight, // Height of the text
          );

          // Draw the text on top of the background
          context.fillStyle = "white"; // Text color
          context.fillText(text, xmin + 3, labelY - 3);

          console.log(obj.label, ymin, canvas.height);
        });
      };

      img.src = image;
    }
  }, [result, action, image]);

  function handleImageDrop(val) {
    const imageUrl = URL.createObjectURL(val[0]);
    setImage(imageUrl);
    setFile(val[0]);
    setResult(null);
    setChartData(initalChartData);
  }

  return (
    <Stack>
      <Flex direction={{ base: "column", md: "row" }} gap={"md"}>
        <Paper withBorder p={"md"} w={"100%"}>
          <Dropzone
            h={300}
            multiple={false}
            openRef={openRef}
            onDrop={handleImageDrop}
            radius="md"
            accept={[MIME_TYPES.jpeg, MIME_TYPES.png, MIME_TYPES.webp]}
            maxSize={30 * 1024 ** 2}
          >
            <Dropzone.Accept>
              <Stack align="center" justify="space-between" gap={"xs"}>
                <TbPhotoDown size={80} />
                <Text ta="center" fw={700} fz="lg" mt="xl">
                  Drop images here
                </Text>
              </Stack>
            </Dropzone.Accept>
            <Dropzone.Reject>
              <Stack align="center" justify="space-between" gap={"xs"}>
                <TbPhotoX size={80} />
                <Text ta="center" fw={700} fz="lg" mt="xl">
                  Unsupported Type
                </Text>
              </Stack>
            </Dropzone.Reject>
            <Dropzone.Idle>
              {image ? (
                <>
                  <MantineImage
                    src={image}
                    fit="contain"
                    alt="uploaded"
                    radius={"md"}
                    h={300}
                  />
                </>
              ) : (
                <Stack align="center" justify="space-evenly" gap={"xs"} h={300}>
                  <TbPhotoUp size={120} />
                  <Text ta="center" fw={700} fz="lg" mt="xl">
                    Upload Images
                  </Text>
                  <Text ta="center" fz="sm" mt="xs" c="dimmed">
                    Drag&apos;n&apos;drop images here to upload. We can accept
                    only <i>.jpeg</i> <i>.png</i> <i>.webp</i> Image formats.
                  </Text>
                </Stack>
              )}
            </Dropzone.Idle>
          </Dropzone>
        </Paper>
        {action?.value === "detect-obj" && (
          <Paper p={"md"} withBorder w={"100%"}>
            <Skeleton visible={loading}>
              <Group justify="center">
                <canvas
                  ref={canvasRef}
                  style={{
                    borderRadius: "5px",
                    height: "300px",
                  }}
                />
              </Group>
            </Skeleton>
          </Paper>
        )}
        {action?.value === "detect-emo" && (
          <Paper p={"md"} w="100%" withBorder>
            <RadarChart
              h={300}
              data={chartData}
              dataKey="label"
              series={[{ name: "score" }]}
            />{" "}
          </Paper>
        )}
      </Flex>
      <Group grow>
        <Select
          placeholder="Select Action"
          data={[
            { label: "Handwriting Parser", value: "generate-ocr" },
            { label: "Caption Generator", value: "generate-caption" },
            { label: "Object Detection", value: "detect-obj" },
            { label: "Emotion Detection", value: "detect-emo" },
          ]}
          value={action ? action.value : null}
          onChange={(_value, option) => setAction(option)}
        />
        <Button
          disabled={!(image && action)}
          loading={loading}
          onClick={performAction}
        >
          Perform
        </Button>
      </Group>
      <Paper p={"md"} w="100%" withBorder>
        <Spoiler maxHeight={120} showLabel="Show more" hideLabel="Hide">
          {result ? result : defaultText}
        </Spoiler>
      </Paper>
    </Stack>
  );
}
