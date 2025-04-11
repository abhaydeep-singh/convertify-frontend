import { useState, useEffect, ChangeEvent } from "react";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "./components/ui/button";
import { Progress } from "@/components/ui/progress";

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<string | undefined>("");
  const [isUploading, setIsUploading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const WSUrl = import.meta.env.VITE_WS_URL;

  useEffect(() => {
    if (!jobId) return;

    const ws = new WebSocket(`${WSUrl}?jobId=${jobId}`);

    ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.progress) setProgress(parseFloat(data.progress));
      if (data.status === "done") {
        setDownloadUrl(`${apiUrl}${data.download}`);
      }
    };

    ws.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

    return () => ws.close();
  }, [jobId]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file!");
      return;
    }

    if (!outputFormat) {
      alert("Please select an output format!");
      return;
    }

    const formData = new FormData();
    formData.append("video", file);

    try {
      setIsUploading(true);
      setProgress(0);
      setDownloadUrl(null);
      setJobId(null);

      const response = await axios.post<{ jobId: string }>(
        `${apiUrl}/upload/${outputFormat}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (event) => {
            const percent = Math.round(
              (event.loaded * 100) / (event.total || 1)
            );
            setProgress(percent);
          },
        }
      );

      setJobId(response.data.jobId);
    } catch (error) {
      alert("Upload failed! Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-black h-screen flex flex-col gap-3 md:gap-16 justify-center items-center">
      <h1 className="text-yellow-400 font-bold text-2xl md:text-6xl">CONVERTIFY</h1>

      <div className="w-[80%] md:w-[30%] mx-auto p-4 rounded-lg shadow-lg text-yellow-300 bg-gray-700">
        <h2 className="text-xl font-bold mb-4">Video Converter</h2>

        <input
          type="file"
          onChange={handleFileChange}
          className="mb-2 w-full p-2 border rounded"
        />

        {file && (
          <p className="text-yellow-400 mt-1 text-sm">Selected: {file.name}</p>
        )}

        <div className="flex gap-4 mt-4 flex-wrap justify-between">
          <Button
            onClick={handleUpload}
            className="bg-yellow-300 text-black hover:text-white"
          >
            Upload & Convert
          </Button>

          <Select value={outputFormat} onValueChange={setOutputFormat}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={<span className="text-yellow-400">Output</span>} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mp4">MP4</SelectItem>
              <SelectItem value="avi">AVI</SelectItem>
              <SelectItem value="mkv">MKV</SelectItem>
              <SelectItem value="webm">WebM</SelectItem>
              <SelectItem value="gif">GIF</SelectItem>
              <SelectItem value="mp3">MP3</SelectItem>
              <SelectItem value="wav">WAV</SelectItem>
              <SelectItem value="aac">AAC</SelectItem>
              <SelectItem value="flac">FLAC</SelectItem>
              <SelectItem value="ogg">OGG</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isUploading && (
        <div className="text-yellow-300 text-center mb-4 animate-pulse">
          Uploading... Please wait.
        </div>
      )}

      <div className="w-[80%] md:w-[40%]">
        {progress > 0 && (
          <>
            <p className="mt-4 text-yellow-300">Progress: {progress}%</p>
            <Progress className="text-white bg-yellow-300" value={progress} />
          </>
        )}
      </div>

      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          className="text-blue-500 underline mt-4"
        >
          Download Converted Video
        </a>
      )}
    </div>
  );
};

export default App;
