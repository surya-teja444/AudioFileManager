import FileCard from "@/components/FileCard";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Mime from "react-native-mime-types";
import { FAB } from "react-native-paper";
import { WebView } from "react-native-webview";

interface FileItem {
  id: string;
  uri: string;
  name: string;
  type: string;
  date: string;
  base64: string;
}

export default function FilesScreen() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const newFile: FileItem = {
        id: Date.now().toString(),
        uri: asset.uri,
        name: asset.fileName || `Document ${files.length + 1}`,
        type: asset.type || "image",
        date: new Date().toISOString(),
        base64: asset.base64 || "",
      };

      const updated = [newFile, ...files];
      setFiles(updated);
      setModalVisible(false);
      await AsyncStorage.setItem("files", JSON.stringify(updated));
    }
  };

  const loadFiles = async () => {
    const data = await AsyncStorage.getItem("files");
    if (data) setFiles(JSON.parse(data));
  };

  const handleOpen = (file: FileItem) => {
    setPreviewFile(file);
  };

  const getBase64Uri = (file: FileItem) => {
    const mime = Mime.lookup(file.name) || "application/octet-stream";
    return `data:${mime};base64,${file.base64}`;
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const renderPreview = (file: FileItem) => {
    const base64Uri = getBase64Uri(file);
    const mime = Mime.lookup(file.name) || "";

    if (mime.startsWith("image/")) {
      return (
        <Image
          source={{ uri: base64Uri }}
          style={styles.previewImage}
          resizeMode="contain"
        />
      );
    } else if (mime.startsWith("video/")) {
      return (
        <Video
          source={{ uri: base64Uri }}
          useNativeControls
          // resizeMode="contain"
          style={styles.previewVideo}
        />
      );
    } else if (mime === "application/pdf") {
      return <WebView source={{ uri: base64Uri }} style={styles.webview} />;
    } else {
      return (
        <View style={styles.unsupportedBox}>
          <Text style={{ textAlign: "center" }}>
            Preview not supported for this file type.
          </Text>
        </View>
      );
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {previewFile ? (
        <>
          <TouchableOpacity
            style={{ alignSelf: "flex-start" }}
            onPress={() => setPreviewFile(null)}
          >
            <FontAwesome name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginTop: 10 }}>
            <View style={styles.previewScreen}>
              <View style={styles.previewContent}>
                {previewFile && renderPreview(previewFile)}
              </View>
            </View>
          </View>
        </>
      ) : (
        <>
          <FlatList
            data={files}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => handleOpen(item)}>
                <FileCard file={{ ...item, name: `Document ${index + 1}` }} />
              </TouchableOpacity>
            )}
          />

          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => setModalVisible(true)}
          />
        </>
      )}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={[styles.browseButton, { marginTop: 10 }]}
              onPress={pickImage}
            >
              <Text style={styles.browseText}>Pick Image</Text>
            </TouchableOpacity>
            {isUploading && (
              <View style={styles.uploadingBox}>
                <ActivityIndicator size="large" color="#7D4CDB" />
                <Text style={{ marginTop: 10 }}>Processing...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 80,
    backgroundColor: "#003F88",
  },
  previewScreen: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  previewContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    width: 280,
  },
  browseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#7D4CDB",
    borderRadius: 8,
  },
  browseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  uploadingBox: {
    marginTop: 20,
    alignItems: "center",
  },
  previewImage: {
    width: Dimensions.get("window").width - 60,
    height: 300,
    borderRadius: 8,
  },
  previewVideo: {
    width: Dimensions.get("window").width - 60,
    height: 300,
    borderRadius: 8,
  },
  webview: {
    width: Dimensions.get("window").width - 60,
    height: 400,
    borderRadius: 8,
  },
  unsupportedBox: {
    padding: 20,
    alignItems: "center",
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#003F88",
    alignSelf: "flex-start",
    borderRadius: 6,
  },
  backText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
