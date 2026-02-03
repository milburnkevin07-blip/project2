import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { ThemedText } from "@/components/ThemedText";
import { HeaderTitle } from "@/components/HeaderTitle";
import DashboardScreen from "@/screens/DashboardScreen";
import ClientsScreen from "@/screens/ClientsScreen";
import JobsScreen from "@/screens/JobsScreen";
import InvoicesScreen from "@/screens/InvoicesScreen";
import CalendarScreen from "@/screens/CalendarScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

export type MainTabParamList = {
  DashboardTab: undefined;
  ClientsTab: undefined;
  JobsTab: undefined;
  CalendarTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function DashboardWrapper() {
  return <DashboardScreen />;
}

function ClientsWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();

  React.useLayoutEffect(() => {
    navigation.getParent()?.setOptions({
      headerRight: () => (
        <HeaderButton onPress={() => navigation.navigate("AddClient")}>
          <ThemedText type="body" style={{ color: theme.link }}>
            Add
          </ThemedText>
        </HeaderButton>
      ),
    });
  }, [navigation, theme]);

  return <ClientsScreen />;
}

function JobsWrapper() {
  return <JobsScreen />;
}

function CalendarWrapper() {
  return <CalendarScreen />;
}

function ProfileWrapper() {
  return <ProfileScreen />;
}

// ✨ Emoji Tab Icon Component
function EmojiTabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ 
      fontSize: 28,
      opacity: focused ? 1 : 0.6,
    }}>
      {emoji}
    </Text>
  );
}

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const screenOptions = useScreenOptions();

  return (
    <Tab.Navigator
      initialRouteName="DashboardTab"
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        ...screenOptions,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardWrapper}
        options={{
          title: "Home",
          headerTitle: () => <HeaderTitle title="Client Job Manager" />,
          tabBarIcon: ({ focused }) => (
            <EmojiTabIcon emoji="🏠" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ClientsTab"
        component={ClientsWrapper}
        options={({ navigation }) => ({
          title: "Clients",
          headerTitle: "Clients",
          tabBarIcon: ({ focused }) => (
            <EmojiTabIcon emoji="👥" focused={focused} />
          ),
          headerRight: () => (
            <HeaderButton
              onPress={() =>
                (navigation as NativeStackNavigationProp<RootStackParamList>)
                  .getParent()
                  ?.navigate("AddClient")
              }
            >
              <ThemedText type="body" style={{ color: theme.link }}>
                Add
              </ThemedText>
            </HeaderButton>
          ),
        })}
      />
      <Tab.Screen
        name="JobsTab"
        component={JobsWrapper}
        options={{
          title: "Jobs",
          headerTitle: "Jobs",
          tabBarIcon: ({ focused }) => (
            <EmojiTabIcon emoji="💼" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="CalendarTab"
        component={CalendarWrapper}
        options={{
          title: "Calendar",
          headerTitle: "Calendar",
          tabBarIcon: ({ focused }) => (
            <EmojiTabIcon emoji="📅" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileWrapper}
        options={{
          title: "Profile",
          headerTitle: "Profile",
          tabBarIcon: ({ focused }) => (
            <EmojiTabIcon emoji="👤" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}