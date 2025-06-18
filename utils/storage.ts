import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeData = async (key: string, data: any) =>
    await AsyncStorage.setItem(key, JSON.stringify(data));

export const getData = async (key: string) => {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : [];
};
