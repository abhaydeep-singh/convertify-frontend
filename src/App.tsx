import { useState, useEffect, ChangeEvent } from "react";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Upload, Download, FileVideo } from "lucide-react";
import { motion } from "framer-motion";

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
      if (data.status === "done")
        setDownloadUrl(`${apiUrl}${data.download}`);
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

    const formData = new FormData();
    formData.append("video", file);

    try {
      setIsUploading(true);
      const response = await axios.post<{ jobId: string }>(
        `${apiUrl}/upload/${outputFormat}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setJobId(response.data.jobId);
      setProgress(0);
      setDownloadUrl(null);
    } catch (error) {
      alert("Upload failed! Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-black min-h-screen flex flex-col items-center justify-center text-yellow-300 p-4">
      <h1 className="text-4xl md:text-6xl font-bold mb-10">🎬 Convertify</h1>

      <div className="bg-white/10 backdrop-blur-lg p-6 md:p-10 rounded-2xl border border-white/20 w-full max-w-xl shadow-2xl">
        <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
          <FileVideo className="w-6 h-6" />
          Video Converter
        </h2>

        <input
          type="file"
          onChange={handleFileChange}
          className="w-full mb-4 bg-gray-800 text-yellow-300 p-2 rounded border border-gray-600"
        />

        {file && file.type.startsWith("video/") && (
          <video
            src={URL.createObjectURL(file)}
            controls
            className="mb-4 w-full rounded"
          />
        )}

        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUpload}
            className="bg-yellow-300 text-black px-4 py-2 rounded font-semibold flex items-center gap-2 hover:bg-yellow-400 transition"
          >
            <Upload className="w-4 h-4" />
            Upload & Convert
          </motion.button>

          <Select value={outputFormat} onValueChange={setOutputFormat}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Output Format" />
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

        {isUploading && (
          <p className="text-center text-yellow-400 mb-4">Uploading...</p>
        )}

        {progress > 0 && (
          <>
            <p className="mb-2 text-yellow-400">Progress: {progress.toFixed(2)}%</p>
            <Progress value={progress} className="bg-yellow-300" />
          </>
        )}

        {downloadUrl && (
          <a
            href={downloadUrl}
            download
            className="mt-4 inline-flex items-center gap-2 text-blue-400 hover:underline"
          >
            <Download className="w-4 h-4" />
            Download Converted Video
          </a>
        )}
      </div>
    </div>
  );
};

export default App;
