import QtQuick 2.15

// The toolbar above the invoice list.
Rectangle {
    id: toolbar
    height: 48

    Row {
        spacing: 10
        anchors.verticalCenter: parent.verticalCenter

        Rectangle {
            id: exportButton
            width: 96
            height: 36
            radius: 8
            color: "#2563eb"

            Text {
                anchors.centerIn: parent
                text: "Export"
                color: "#ffffff"
                font.pixelSize: 13
                font.bold: true
            }
        }

        Text {
            text: "Synced an hour ago"
            color: "#9ca3af"
            font.pixelSize: 15
        }
    }
}
