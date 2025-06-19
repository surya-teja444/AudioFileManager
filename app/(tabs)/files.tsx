import FileCard from "@/components/FileCard";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
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
      allowsEditing: false,
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const mimeType =
        asset.type === "video"
          ? "video/mp4"
          : asset.type === "image"
          ? "image/jpeg"
          : "application/octet-stream";

      const newFile: FileItem = {
        id: Date.now().toString(),
        uri: asset.uri,
        name: asset.fileName || `Media_${files.length + 1}`,
        type: mimeType,
        date: new Date().toISOString(),
        base64: asset.base64 || "",
      };

      const updated = [newFile, ...files];
      setFiles(updated);
      await AsyncStorage.setItem("files", JSON.stringify(updated));
      setModalVisible(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setIsUploading(true);

      const asset = result.assets[0];
      const mimeType =
        asset.mimeType || Mime.lookup(asset.name) || "application/octet-stream";

      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const newFile: FileItem = {
        id: Date.now().toString(),
        uri: asset.uri,
        name: asset.name || `Document_${files.length + 1}`,
        type: mimeType,
        date: new Date().toISOString(),
        base64: base64,
      };

      const updated = [newFile, ...files];
      setFiles(updated);
      await AsyncStorage.setItem("files", JSON.stringify(updated));
      setModalVisible(false);
    } catch (error) {
      console.error("Error reading document:", error);
    } finally {
      setIsUploading(false);
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
    console.log("file.uri", file.uri);
    const mime = Mime.lookup(file.name) || file.type || "";
    console.log("base64Uri", base64Uri);
    console.log("mime", mime);
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
          source={{ uri: file.uri }}
          useNativeControls
          style={styles.previewVideo}
        />
      );
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
              <Text style={styles.browseText}>Pick Image/Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.browseButton, { marginTop: 10 }]}
              onPress={pickDocument}
            >
              <Text style={styles.browseText}>Pick PDF</Text>
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
  pdfRenderer: {
    width: Dimensions.get("window").width - 60,
    height: 400,
    backgroundColor: "#fff",
    borderRadius: 8,
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
});
