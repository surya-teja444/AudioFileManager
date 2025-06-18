// import { FontAwesome } from '@expo/vector-icons';
// import { Tabs } from 'expo-router';

// export default function Layout() {
//   return (
//     <Tabs>
//       <Tabs.Screen
//         name="audio"
//         options={{
//           title: 'Audio Library', 
//           tabBarIcon: ({ color }) => <FontAwesome name="music" size={24} />,
//          }} />
//       <Tabs.Screen
//         name="files"
//         options={{
//           title: 'Documents',
//           tabBarIcon: ({ color }) => <FontAwesome name="file" size={24} color="black" />,
//          }} />
//     </Tabs>
//   );
// }
import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="audio"
        options={{
          title: 'Audio Library',
          tabBarIcon: ({ color }) => <FontAwesome name="music" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="files"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color }) => <FontAwesome name="file" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
