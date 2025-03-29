/**
 * Converts React component code to different programming languages
 */

// Interface for language options
export interface LanguageOption {
  id: string;
  name: string;
  extension: string;
}

// Available language options
export const languageOptions: LanguageOption[] = [
  { id: 'javascript', name: 'JavaScript', extension: 'js' },
  { id: 'typescript', name: 'TypeScript', extension: 'tsx' },
  { id: 'python', name: 'Python', extension: 'py' },
  { id: 'cpp', name: 'C++', extension: 'cpp' },
  { id: 'java', name: 'Java', extension: 'java' },
  { id: 'csharp', name: 'C#', extension: 'cs' },
  { id: 'swift', name: 'Swift', extension: 'swift' },
  { id: 'kotlin', name: 'Kotlin', extension: 'kt' },
];

/**
 * Converts React component code to a different programming language
 * 
 * @param code The React component code to convert
 * @param language The target language to convert to
 * @returns The converted code as a string
 */
export function convertComponentCode(code: string, language: string): string {
  // Extract component name from the React code
  const componentNameMatch = code.match(/(?:function|const)\s+([A-Za-z0-9_]+)/);
  const componentName = componentNameMatch ? componentNameMatch[1] : 'Component';
  
  // Basic conversion for different languages
  switch (language) {
    case 'javascript':
      // Just return the original React code for JavaScript
      return code;
      
    case 'typescript':
      // Add TypeScript types to the React code
      return code.replace(
        'export default ' + componentName + ';', 
        'interface ' + componentName + 'Props {}\n\n' + 
        'export default ' + componentName + ' as React.FC<' + componentName + 'Props>;'
      );
      
    case 'python':
      return `# Python equivalent using Streamlit
import streamlit as st

def ${componentName}():
    """A Python implementation of the React component using Streamlit"""
    st.title("${componentName}")
    
    # Container with styling similar to the React component
    with st.container():
        st.markdown("""
        <style>
        .component-container {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 16px;
            max-width: 100%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        </style>
        """, unsafe_allow_html=True)
        
        # Component content
        st.markdown('<div class="component-container">', unsafe_allow_html=True)
        st.write("This is the ${componentName} component")
        # Add buttons, inputs, etc. based on component needs
        if st.button("Action Button"):
            st.success("Button clicked!")
        st.markdown('</div>', unsafe_allow_html=True)

# Run the app
if __name__ == "__main__":
    ${componentName}()
`;
      
    case 'cpp':
      return `// C++ equivalent using Qt framework
#include <QApplication>
#include <QWidget>
#include <QVBoxLayout>
#include <QLabel>
#include <QPushButton>
#include <QStyle>
#include <QStyleOption>

class ${componentName} : public QWidget {
public:
    ${componentName}(QWidget *parent = nullptr) : QWidget(parent) {
        // Set up the layout
        QVBoxLayout *layout = new QVBoxLayout(this);
        
        // Add title
        QLabel *titleLabel = new QLabel("${componentName}", this);
        titleLabel->setStyleSheet("font-size: 18px; font-weight: bold; color: #333;");
        layout->addWidget(titleLabel);
        
        // Add content area
        QWidget *contentArea = new QWidget(this);
        contentArea->setStyleSheet(
            "background-color: white;"
            "border: 1px solid #e0e0e0;"
            "border-radius: 8px;"
            "padding: 16px;"
        );
        QVBoxLayout *contentLayout = new QVBoxLayout(contentArea);
        
        QLabel *contentLabel = new QLabel("This is the ${componentName} content", contentArea);
        contentLayout->addWidget(contentLabel);
        
        // Add button
        QPushButton *button = new QPushButton("Action Button", contentArea);
        button->setStyleSheet(
            "background-color: #4f46e5;"
            "color: white;"
            "border: none;"
            "padding: 8px 16px;"
            "border-radius: 4px;"
        );
        contentLayout->addWidget(button);
        
        layout->addWidget(contentArea);
        setLayout(layout);
        
        // Connect signals
        connect(button, &QPushButton::clicked, this, &${componentName}::onButtonClicked);
    }
    
private slots:
    void onButtonClicked() {
        qDebug("Button clicked!");
    }
};

int main(int argc, char *argv[]) {
    QApplication app(argc, argv);
    
    ${componentName} widget;
    widget.resize(400, 300);
    widget.setWindowTitle("${componentName}");
    widget.show();
    
    return app.exec();
}
`;
      
    case 'java':
      return `// Java equivalent using JavaFX
import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import javafx.scene.layout.BorderPane;

public class ${componentName} extends Application {
    
    @Override
    public void start(Stage primaryStage) {
        // Create the root container
        BorderPane root = new BorderPane();
        
        // Create the content container with styling
        VBox container = new VBox(10);
        container.setPadding(new Insets(16));
        container.setStyle(
            "-fx-background-color: white;" +
            "-fx-border-color: #e0e0e0;" +
            "-fx-border-radius: 8px;" +
            "-fx-padding: 16px;" +
            "-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.1), 4, 0, 0, 2);"
        );
        
        // Create title
        Label titleLabel = new Label("${componentName}");
        titleLabel.setStyle("-fx-font-size: 18px; -fx-font-weight: bold;");
        
        // Create content
        Label contentLabel = new Label("This is the ${componentName} content");
        
        // Create button
        Button actionButton = new Button("Action Button");
        actionButton.setStyle(
            "-fx-background-color: #4f46e5;" +
            "-fx-text-fill: white;" +
            "-fx-padding: 8px 16px;" +
            "-fx-background-radius: 4px;"
        );
        
        // Add action
        actionButton.setOnAction(e -> System.out.println("Button clicked!"));
        
        // Add components to container
        container.getChildren().addAll(titleLabel, contentLabel, actionButton);
        
        // Add container to root
        root.setCenter(container);
        
        // Create scene
        Scene scene = new Scene(root, 400, 300);
        
        // Set stage
        primaryStage.setTitle("${componentName}");
        primaryStage.setScene(scene);
        primaryStage.show();
    }
    
    public static void main(String[] args) {
        launch(args);
    }
}
`;
      
    case 'csharp':
      return `// C# equivalent using WPF
using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace ComponentApp
{
    public partial class ${componentName} : Window
    {
        public ${componentName}()
        {
            // Set window properties
            Title = "${componentName}";
            Width = 400;
            Height = 300;
            
            // Create main container
            var grid = new Grid();
            
            // Create content container with styling
            var container = new StackPanel
            {
                Margin = new Thickness(16),
                Background = new SolidColorBrush(Colors.White)
            };
            
            // Add border
            var border = new Border
            {
                BorderBrush = new SolidColorBrush(Color.FromRgb(224, 224, 224)),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(8),
                Padding = new Thickness(16),
                Child = container
            };
            
            // Add drop shadow
            border.Effect = new System.Windows.Media.Effects.DropShadowEffect
            {
                BlurRadius = 4,
                ShadowDepth = 2,
                Opacity = 0.1
            };
            
            // Create title
            var titleLabel = new Label
            {
                Content = "${componentName}",
                FontSize = 18,
                FontWeight = FontWeights.Bold,
                Margin = new Thickness(0, 0, 0, 10)
            };
            
            // Create content
            var contentLabel = new Label
            {
                Content = "This is the ${componentName} content",
                Margin = new Thickness(0, 0, 0, 10)
            };
            
            // Create button
            var actionButton = new Button
            {
                Content = "Action Button",
                Padding = new Thickness(8, 8, 8, 8),
                Background = new SolidColorBrush(Color.FromRgb(79, 70, 229)),
                Foreground = new SolidColorBrush(Colors.White),
                BorderThickness = new Thickness(0),
                HorizontalAlignment = HorizontalAlignment.Left
            };
            
            // Add action
            actionButton.Click += (sender, e) => MessageBox.Show("Button clicked!");
            
            // Add components to container
            container.Children.Add(titleLabel);
            container.Children.Add(contentLabel);
            container.Children.Add(actionButton);
            
            // Add container to grid
            grid.Children.Add(border);
            
            // Set content
            Content = grid;
        }
        
        [STAThread]
        static void Main()
        {
            var app = new Application();
            app.Run(new ${componentName}());
        }
    }
}
`;
      
    case 'swift':
      return `// Swift equivalent using SwiftUI
import SwiftUI

struct ${componentName}: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("${componentName}")
                .font(.title)
                .fontWeight(.bold)
            
            VStack(alignment: .leading, spacing: 12) {
                Text("This is the ${componentName} content")
                    .padding(.bottom, 8)
                
                Button(action: {
                    print("Button clicked!")
                }) {
                    Text("Action Button")
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color(red: 79/255, green: 70/255, blue: 229/255))
                        .foregroundColor(.white)
                        .cornerRadius(4)
                }
            }
            .padding(16)
            .background(Color.white)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color(red: 224/255, green: 224/255, blue: 224/255), lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
            
            Spacer()
        }
        .padding(16)
        .navigationTitle("${componentName}")
    }
}

// Preview
struct ${componentName}_Previews: PreviewProvider {
    static var previews: some View {
        ${componentName}()
    }
}

// App entry point
@main
struct ${componentName}App: App {
    var body: some Scene {
        WindowGroup {
            NavigationView {
                ${componentName}()
            }
        }
    }
}
`;
      
    case 'kotlin':
      return `// Kotlin equivalent using Jetpack Compose
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ${componentName}()
        }
    }
}

@Composable
fun ${componentName}() {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("${componentName}") }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .padding(paddingValues)
                .padding(16.dp)
                .fillMaxSize(),
            verticalArrangement = Arrangement.Top
        ) {
            Text(
                text = "${componentName}",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                elevation = 4.dp
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("This is the ${componentName} content")
                    
                    Button(
                        onClick = { println("Button clicked!") },
                        colors = ButtonDefaults.buttonColors(
                            backgroundColor = Color(0xFF4F46E5),
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            "Action Button",
                            modifier = Modifier.padding(horizontal = 8.dp)
                        )
                    }
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun DefaultPreview() {
    ${componentName}()
}
`;
      
    default:
      return code;
  }
}

/**
 * Generates a file name for a component in a specific language
 * 
 * @param componentName The name of the component
 * @param language The language option
 * @returns A file name string
 */
export function generateFileName(componentName: string, language: LanguageOption): string {
  // Extract component name if not provided
  if (!componentName) {
    return `component.${language.extension}`;
  }
  
  // Format the file name based on language conventions
  switch (language.id) {
    case 'python':
      return `${componentName.toLowerCase()}.${language.extension}`;
    case 'java':
      return `${componentName}.${language.extension}`;
    case 'kotlin':
      return `${componentName}.${language.extension}`;
    case 'swift':
      return `${componentName}.${language.extension}`;
    case 'csharp':
      return `${componentName}.${language.extension}`;
    case 'cpp':
      return `${componentName.toLowerCase()}.${language.extension}`;
    default:
      return `${componentName}.${language.extension}`;
  }
} 