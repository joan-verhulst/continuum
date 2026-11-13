// Dear ImGui style for the editor's panels.
#include "imgui.h"

void ApplyStyle()
{
    ImGuiStyle& style = ImGui::GetStyle();
    style.FrameRounding = 8.0f;
    style.WindowRounding = 4.0f;

    ImVec4* colors = style.Colors;
    colors[ImGuiCol_Button] = ImVec4(0.23f, 0.51f, 0.96f, 1.00f);
    colors[ImGuiCol_Border] = ImVec4(0.90f, 0.91f, 0.92f, 1.00f);
    colors[ImGuiCol_TextDisabled] = ImVec4(0.61f, 0.64f, 0.69f, 1.00f);
}
