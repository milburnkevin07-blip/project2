import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@/context/AuthContext";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import LoginScreen from "@/screens/LoginScreen";
import AddEditClientScreen from "@/screens/AddEditClientScreen";
import AddEditJobScreen from "@/screens/AddEditJobScreen";
import AddEditInvoiceScreen from "@/screens/AddEditInvoiceScreen";
import AddEditQuoteScreen from "@/screens/AddEditQuoteScreen";
import ClientDetailsScreen from "@/screens/ClientDetailsScreen";
import JobDetailsScreen from "@/screens/JobDetailsScreen";
import InvoiceDetailsScreen from "@/screens/InvoiceDetailsScreen";
import QuoteDetailsScreen from "@/screens/QuoteDetailsScreen";
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  AddClient: undefined;
  EditClient: { clientId: string };
  AddJob: { clientId?: string };
  EditJob: { jobId: string };
  AddInvoice: { clientId?: string; jobId?: string };
  EditInvoice: { invoiceId: string };
  AddQuote: { clientId?: string; jobId?: string };
  EditQuote: { quoteId: string };
  ClientDetails: { clientId: string };
  JobDetails: { jobId: string };
  InvoiceDetails: { invoiceId: string };
  QuoteDetails: { quoteId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.backgroundRoot }}>
        <ActivityIndicator size="large" color={theme.link} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddClient"
            component={AddEditClientScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="EditClient"
            component={AddEditClientScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="AddJob"
            component={AddEditJobScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="EditJob"
            component={AddEditJobScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="AddInvoice"
            component={AddEditInvoiceScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="EditInvoice"
            component={AddEditInvoiceScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="AddQuote"
            component={AddEditQuoteScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="EditQuote"
            component={AddEditQuoteScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} />
          <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
          <Stack.Screen name="InvoiceDetails" component={InvoiceDetailsScreen} />
          <Stack.Screen name="QuoteDetails" component={QuoteDetailsScreen} />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
