import { FontAwesome } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AudioPlayer({ audio }: { audio: any }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playPauseAudio = async () => {
    if (sound && isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
      return;
    }

    if (!sound) {
      const { sound: newSound } = await Audio.Sound.createAsync({
        uri: audio.uri,
      });
      setSound(newSound);
      await newSound.playAsync();
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          setSound(null); // release
        }
      });
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds < 10 ? "0" : ""}${seconds}s`;
  };

  const getSize = () => {
    return (audio.duration / 1000 / 60).toFixed(1) + "mb";
  };

  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <FontAwesome name="microphone" size={24} color="#007AFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{`Audio${audio.id.slice(-2)}.mp3`}</Text>
        <Text style={styles.details}>
          {formatDuration(audio.duration || 0)} – {getSize()}
        </Text>
      </View>
      <TouchableOpacity onPress={playPauseAudio}>
        <FontAwesome
          name={isPlaying ? "pause" : "play"}
          size={24}
          color="#A58CF6"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
  },
  icon: {
    backgroundColor: "#EAE8FE",
    padding: 12,
    borderRadius: 10,
    marginRight: 12,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  },
  details: {
    color: "#666",
    marginTop: 2,
  },
});
