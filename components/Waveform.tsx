import { StyleSheet, View } from "react-native";

type Props = {
  uri: string | null;
  isRecording: boolean;
};

export default function Waveform({ isRecording }: Props) {
  return (
    <View style={styles.container}>
      {[...Array(30)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              height: Math.random() * 30 + 10,
              backgroundColor: isRecording ? "#FF5C5C" : "#7D4CDB",
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignSelf: "center",
    marginVertical: 16,
    gap: 2,
  },
  bar: {
    width: 3,
    borderRadius: 4,
  },
});
