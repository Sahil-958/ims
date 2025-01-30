import "./App.css";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import { Outlet } from "react-router";
import { useState } from "react";
import { generateColors } from "@mantine/colors-generator";
import {
  MantineProvider,
  ColorInput,
  Space,
  Paper,
  AppShell,
  Burger,
  Group,
  Slider,
  Title,
  Modal,
  ActionIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { CgRename } from "react-icons/cg";
import { TbSettings } from "react-icons/tb";
import ThemeSwitcher from "./components/ThemeSwitcher";
import DropzoneButton from "./components/DropzoneButton.jsx";
import "@mantine/core/styles.css";

function App() {
  let color = window.localStorage.getItem("accentColor");
  const [accentColor, setAccentColor] = useState(color || "#397e9eff");
  const [primaryShade, setPrimaryShade] = useState(7);
  function updateAccentColor(color) {
    setAccentColor(color);
    window.localStorage.setItem("accentColor", color);
  }
  const [opened, { toggle }] = useDisclosure();
  const [openedModel, { open: openModel, close: closeModel }] =
    useDisclosure(false);
  return (
    <>
      <MantineProvider
        defaultColorScheme="auto"
        theme={{
          primaryColor: "custom",
          primaryShade: primaryShade,
          colors: { custom: generateColors(accentColor) },
        }}
      >
        <AppShell header={{ height: 60 }} padding="md">
          <AppShell.Header>
            <Group h="100%" px="md" justify="space-between">
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
              />

              <Group align="center" spacing="xs" visibleFrom="xs">
                <CgRename size={30} />
                <Title order={3}>Image Processing System</Title>
              </Group>
              <ActionIcon variant="filled" onClick={openModel}>
                <TbSettings />
              </ActionIcon>
            </Group>
          </AppShell.Header>
          <AppShell.Main>
            <Modal
              opened={openedModel}
              onClose={closeModel}
              withCloseButton={false}
            >
              <Paper p="md" m={"sm"} withBorder shadow="xl" radius="md">
                <Slider
                  value={primaryShade}
                  min={0}
                  max={9}
                  step={1}
                  onChange={setPrimaryShade}
                />
                <Space h="xs" />
                <ColorInput
                  variant="filled"
                  disallowInput
                  onChange={updateAccentColor}
                  defaultValue={accentColor}
                  format="hexa"
                />
                <Space h="xs" />
                <ThemeSwitcher />
              </Paper>
            </Modal>
            <DropzoneButton />
            <Outlet />
          </AppShell.Main>
        </AppShell>
      </MantineProvider>
    </>
  );
}

export default App;
