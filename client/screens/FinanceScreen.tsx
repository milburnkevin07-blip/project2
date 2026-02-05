import React, { useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { useTheme } from "@/hooks/useTheme";
import { AppColors, Spacing } from "@/constants/theme";
import InvoicesScreen from "@/screens/InvoicesScreen";
import QuotesScreen from "@/screens/QuotesScreen";

const renderScene = SceneMap({
  invoices: InvoicesScreen,
  quotes: QuotesScreen,
});

export default function FinanceScreen() {
  const layout = useWindowDimensions();
  const { theme } = useTheme();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "invoices", title: "Invoices" },
    { key: "quotes", title: "Quotes" },
  ]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: AppColors.primary, height: 3 }}
            style={{ backgroundColor: theme.backgroundRoot, elevation: 0, shadowOpacity: 0 }}
            labelStyle={{ fontWeight: "600", textTransform: "none", fontSize: 16 }}
            activeColor={AppColors.primary}
            inactiveColor={theme.textSecondary}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
