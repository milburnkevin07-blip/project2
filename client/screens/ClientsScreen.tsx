import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, TextInput, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ClientCard } from "@/components/ClientCard";
import { EmptyState } from "@/components/EmptyState";
import { useData } from "@/context/DataContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Client } from "@/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ClientsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { clients, getJobCountForClient, isLoading, refreshData } = useData();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.company?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredClients]);

  const handleClientPress = (client: Client) => {
    navigation.navigate("ClientDetails", { clientId: client.id });
  };

  const renderItem = ({ item }: { item: Client }) => (
    <View style={styles.cardItem}>
      <ClientCard
        client={item}
        jobCount={getJobCountForClient(item.id)}
        onPress={() => handleClientPress(item)}
      />
    </View>
  );

  const renderEmpty = () => (
    <EmptyState
      image={require("../../assets/images/empty-clients.png")}
      title="No clients yet"
      message="Add your first client to get started"
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={sortedClients}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchBox,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <Feather
                name="search"
                size={18}
                color={theme.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search clients..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 ? (
                <Feather
                  name="x"
                  size={18}
                  color={theme.textSecondary}
                  onPress={() => setSearchQuery("")}
                />
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    marginBottom: Spacing.lg,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  cardItem: {
    marginBottom: Spacing.sm,
  },
});
