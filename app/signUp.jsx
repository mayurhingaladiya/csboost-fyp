import { Alert, StyleSheet, Text, View, Pressable, Modal, FlatList, TouchableOpacity } from 'react-native';
import React, { useRef, useState } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import { theme } from '../constants/theme'
import Icon from '../assets/icons'
import { StatusBar } from 'expo-status-bar'
import BackButton from '../components/BackButton'
import { useRouter } from 'expo-router'
import { hp, wp } from './helpers/common'
import Input from '../components/Input'
import Button from '../components/Button'
import { supabase } from './lib/supabase'

const optionsByLevel = {
  GCSE: ["AQA", "OCR", "Edexcel"],
  "A-Level": ["AQA", "OCR"],
};

const signUp = () => {
  const router = useRouter();
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [loading, setLoading] = useState(false);
  const [education_level, setLevel] = useState("");
  const [exam_specification, setSpecification] = useState("");
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);

  const onSubmit = async () => {
    if (!emailRef.current || !passwordRef.current || !education_level || !exam_specification) {
      Alert.alert('Sign Up', "Please fill all fields!");
      return;
    }
    // Handle sign-up logic
    let email = emailRef.current.trim();
    let password = passwordRef.current.trim();


    setLoading(true);

    const { data: { session }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          email,
          education_level,
          exam_specification
        }
      }
    });
    setLoading(false)

    if (error) {
      Alert.alert('Sign up', error.message)
    }

  };

  const renderModal = (visible, setVisible, data, onSelect) => (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <FlatList
            data={data}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  onSelect(item);
                  setVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <Button title="Close" onPress={() => setVisible(false)} />
        </View>
      </View>
    </Modal>
  );

  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={styles.container}>
        <BackButton router={router} />

        {/* Welcome Text */}
        <View>
          <Text style={styles.welcomeText}>Let's</Text>
          <Text style={styles.welcomeText}>Get Started</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
            Please fill the details to create an account.
          </Text>
          <Input
            icon={<Icon name="email" size={26} strokeWidth={1.6} />}
            placeholder="Enter your email"
            onChangeText={(value) => (emailRef.current = value)}
          />
          <Input
            icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
            secureTextEntry
            placeholder="Enter your password"
            onChangeText={(value) => (passwordRef.current = value)}
          />

          {/* Level Selector */}
          <Pressable style={[styles.input, { opacity: education_level ? 1 : 0.5 }]} onPress={() => setShowLevelModal(true)}>
            <Text style={styles.inputText}>{education_level || "Select Level"}</Text>
          </Pressable>
          {renderModal(showLevelModal, setShowLevelModal, Object.keys(optionsByLevel), setLevel)}

          {/* Specification Selector */}
          <Pressable
            style={[styles.input, { opacity: education_level ? 1 : 0.5 }]}
            onPress={() => education_level && setShowSpecModal(true)}
            disabled={!education_level}
          >
            <Text style={styles.inputText}>{exam_specification || "Select Specification"}</Text>
          </Pressable>
          {renderModal(
            showSpecModal,
            setShowSpecModal,
            education_level ? optionsByLevel[education_level] : [],
            setSpecification
          )}
          {education_level && exam_specification && <Text style={styles.footerText}>Don't worry you can change the level and specification later in settings.</Text>
          }

          <Button title="Sign Up" loading={loading} onPress={onSubmit} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable onPress={() => router.push('login')}>
            <Text
              style={[
                styles.footerText,
                { color: theme.colors.primaryDark, fontWeight: theme.fonts.semibold },
              ]}
            >
              Log in
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default signUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 35,
    paddingHorizontal: wp(5),
  },
  welcomeText: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  form: {
    gap: 25,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 15,
    flexDirection: "row",
    height: hp(6.5),
    alignItems: "center",
    justifyContent: "start",
    borderRadius: theme.radius.xxl,
    borderColor: theme.colors.text,
  },
  inputText: {
    fontSize: hp(1.5),
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalItem: {
    padding: 15,
    borderWidth: 1,
    borderColor: theme.colors.dark,
    borderRadius: 22,
    marginBottom: hp(2)
  },
  modalItemText: {
    fontSize: hp(2),
    color: theme.colors.text,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  footerText: {
    textAlign: "center",
    color: theme.colors.text,
    fontSize: hp(1.6),
  },
});
