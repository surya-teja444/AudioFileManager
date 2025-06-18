import AudioPlayer from "@/components/AudioPlayer";
import Waveform from "@/components/Waveform";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FAB } from "react-native-paper";

export default function AudioScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audios, setAudios] = useState<any[]>([]);
  const [showRecorder, setShowRecorder] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [previewSound, setPreviewSound] = useState<Audio.Sound | null>(null);
  const [previewIsPlaying, setPreviewIsPlaying] = useState(false);
  const [previewPositionMillis, setPreviewPositionMillis] = useState(0);
  const [previewSoundDuration, setPreviewSoundDuration] = useState(1);
  const [selectedAudio, setSelectedAudio] = useState<any | null>(null);
  const [selectedSound, setSelectedSound] = useState<Audio.Sound | null>(null);
  const [selectedIsPlaying, setSelectedIsPlaying] = useState(false);
  const [selectedPositionMillis, setSelectedPositionMillis] = useState(0);
  const [selectedDurationMillis, setSelectedDurationMillis] = useState(1);
  const previewIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const selectedIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) return alert("Permission required");

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();
    setRecording(rec);
    setRecordedUri(null);
  };

  const stopRecording = async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const dur = (await recording.getStatusAsync()).durationMillis;
    setRecordedUri(uri || null);
    setPreviewSoundDuration(dur || 1);
    setRecording(null);
  };

  const saveRecording = async () => {
    if (!recordedUri) return;
    const id = Date.now().toString();
    const newAudio = { id, uri: recordedUri, duration: previewSoundDuration };
    const updated = [newAudio, ...audios];
    setAudios(updated);
    await AsyncStorage.setItem("audios", JSON.stringify(updated));
    resetRecorder();
  };

  const resetRecorder = async () => {
    setRecordedUri(null);
    setPreviewSoundDuration(1);
    setRecording(null);
    setShowRecorder(false);
    setPreviewIsPlaying(false);
    setPreviewPositionMillis(0);

    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }

    if (previewSound) {
      try {
        await previewSound.stopAsync();
        await previewSound.unloadAsync();
      } catch (e) {
        console.warn("Error unloading preview sound", e);
      }
      setPreviewSound(null);
    }
  };

  const playPausePreview = async () => {
    if (!recordedUri) return;

    if (!previewSound) {
      const { sound } = await Audio.Sound.createAsync(
        { uri: recordedUri },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;
          setPreviewPositionMillis(status.positionMillis || 0);
          setPreviewIsPlaying(status.isPlaying);
        }
      );
      setPreviewSound(sound);
      previewIntervalRef.current = setInterval(async () => {
        const status = await sound.getStatusAsync();
        if (status.isLoaded)
          setPreviewPositionMillis(status.positionMillis || 0);
      }, 500);
      return;
    }

    const status = await previewSound.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await previewSound.pauseAsync();
      setPreviewIsPlaying(false);
      return;
    }

    await previewSound.playAsync();
    setPreviewIsPlaying(true);
  };

  const handlePreviewSeek = async (value: number) => {
    if (previewSound) {
      await previewSound.setPositionAsync(value);
      setPreviewPositionMillis(value);
    }
  };

  const playSelectedAudio = async (audio: any) => {
    setSelectedAudio(audio);
    const { sound } = await Audio.Sound.createAsync(
      { uri: audio.uri },
      { shouldPlay: true },
      (status) => {
        if (!status.isLoaded) return;
        setSelectedIsPlaying(status.isPlaying);
        setSelectedPositionMillis(status.positionMillis || 0);
        setSelectedDurationMillis(status.durationMillis || 1);
      }
    );
    setSelectedSound(sound);
    selectedIntervalRef.current = setInterval(async () => {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        setSelectedPositionMillis(status.positionMillis || 0);
      }
    }, 500);
  };

  const toggleSelectedPlayback = async () => {
    if (!selectedSound) return;
    const status = await selectedSound.getStatusAsync();
    if (status.isPlaying) {
      await selectedSound.pauseAsync();
      setSelectedIsPlaying(false);
    } else {
      await selectedSound.playAsync();
      setSelectedIsPlaying(true);
    }
  };

  const handleSelectedSeek = async (value: number) => {
    if (selectedSound) {
      await selectedSound.setPositionAsync(value);
      setSelectedPositionMillis(value);
    }
  };

  const closeSelectedAudio = async () => {
    if (selectedSound) {
      await selectedSound.stopAsync();
      await selectedSound.unloadAsync();
      setSelectedSound(null);
    }
    if (selectedIntervalRef.current) {
      clearInterval(selectedIntervalRef.current);
      selectedIntervalRef.current = null;
    }
    setSelectedAudio(null);
    setSelectedIsPlaying(false);
    setSelectedPositionMillis(0);
  };

  const loadAudios = async () => {
    const data = await AsyncStorage.getItem("audios");
    if (data) setAudios(JSON.parse(data));
  };

  useEffect(() => {
    loadAudios();
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {!showRecorder && !selectedAudio && (
        <FlatList
          data={audios}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => playSelectedAudio(item)}>
              <AudioPlayer audio={item} />
            </TouchableOpacity>
          )}
        />
      )}

      {showRecorder && (
        <View style={styles.recorderBox}>
          <TouchableOpacity
            onPress={resetRecorder}
            style={{ alignSelf: "flex-start" }}
          >
            <FontAwesome name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.micCircle}>
            <FontAwesome name="microphone" size={40} color="#fff" />
          </View>

          <Text style={styles.recorderText}>
            {recording
              ? "Recording... Tap Done to stop."
              : recordedUri
              ? "Recording finished. Preview and Save."
              : "Tap the button below to start recording."}
          </Text>

          {recording && <Waveform uri={null} isRecording={true} />}
          {!recording && recordedUri && (
            <Waveform uri={recordedUri} isRecording={false} />
          )}

          {!recording && !recordedUri && (
            <Button title="Start Recording" onPress={startRecording} />
          )}

          {recording && (
            <Button title="Done" onPress={stopRecording} color="#FF5C5C" />
          )}

          {!recording && recordedUri && (
            <>
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={0}
                maximumValue={previewSoundDuration}
                value={previewPositionMillis}
                onSlidingComplete={handlePreviewSeek}
                minimumTrackTintColor="#7D4CDB"
                maximumTrackTintColor="#ccc"
              />
              <Text style={{ marginBottom: 10 }}>
                {formatTime(previewPositionMillis)} /{" "}
                {formatTime(previewSoundDuration)}
              </Text>
              <TouchableOpacity
                style={styles.playBtn}
                onPress={playPausePreview}
              >
                <FontAwesome
                  name={previewIsPlaying ? "pause" : "play"}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
              <Button title="Save" onPress={saveRecording} color="#4CAF50" />
            </>
          )}
        </View>
      )}

      {selectedAudio && (
        <View style={styles.recorderBox}>
          <TouchableOpacity
            onPress={closeSelectedAudio}
            style={{ alignSelf: "flex-start" }}
          >
            <FontAwesome name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, marginBottom: 16 }}>
            {selectedAudio.id}
          </Text>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={selectedDurationMillis}
            value={selectedPositionMillis}
            onSlidingComplete={handleSelectedSeek}
            minimumTrackTintColor="#7D4CDB"
            maximumTrackTintColor="#ccc"
          />
          <Text style={{ marginBottom: 10 }}>
            {formatTime(selectedPositionMillis)} /{" "}
            {formatTime(selectedDurationMillis)}
          </Text>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={toggleSelectedPlayback}
          >
            <FontAwesome
              name={selectedIsPlaying ? "pause" : "play"}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      )}

      <FAB
        icon={showRecorder ? "close" : "plus"}
        style={{
          position: "absolute",
          right: 20,
          bottom: 80,
          backgroundColor: "#003F88",
        }}
        onPress={() => {
          if (showRecorder) {
            resetRecorder();
          } else {
            setShowRecorder(true);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  recorderBox: {
    backgroundColor: "#F2F2F2",
    padding: 20,
    borderRadius: 16,
    marginTop: 10,
    alignItems: "center",
    flex: 1,
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#7D4CDB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  recorderText: {
    fontSize: 16,
    color: "#444",
    marginBottom: 16,
    textAlign: "center",
  },
  playBtn: {
    flexDirection: "row",
    backgroundColor: "#7D4CDB",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
});
