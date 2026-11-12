using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Windows.Forms;

internal static class SetupLauncher
{
    [STAThread]
    private static void Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string appName = "CALIBRA";
        string manifest = Path.Combine(root, "active-release.json");
        if (File.Exists(manifest))
        {
            appName = System.Text.RegularExpressions.Regex.IsMatch(File.ReadAllText(manifest), @"""edition""\s*:\s*""classroom""") ? "CALIBRA 멀티" : "CALIBRA 퍼스널";
        }
        string script = Path.Combine(root, "설치하기.ps1");
        if (!File.Exists(script))
        {
            MessageBox.Show("SETUP.exe와 설치하기.ps1 파일이 같은 폴더에 있어야 합니다.\nZIP 압축을 푼 뒤 SETUP.exe를 실행하세요.", "CALIBRA 설치", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        Form form = new Form();
        form.Text = appName + " 설치";
        form.FormBorderStyle = FormBorderStyle.FixedDialog;
        form.StartPosition = FormStartPosition.CenterScreen;
        form.ClientSize = new Size(460, 170);
        form.MaximizeBox = false;
        form.MinimizeBox = false;
        form.ControlBox = false;
        form.BackColor = Color.White;

        Label title = new Label();
        title.Text = appName + " 설치";
        title.Font = new Font("Malgun Gothic", 14, FontStyle.Bold);
        title.ForeColor = Color.FromArgb(31, 58, 93);
        title.Location = new Point(24, 22);
        title.Size = new Size(420, 32);

        Label status = new Label();
        status.Text = "설치하고 바탕화면 바로가기를 준비하고 있습니다.";
        status.Font = new Font("Malgun Gothic", 9.5f);
        status.ForeColor = Color.FromArgb(88, 105, 126);
        status.Location = new Point(26, 66);
        status.Size = new Size(420, 25);

        ProgressBar progress = new ProgressBar();
        progress.Style = ProgressBarStyle.Marquee;
        progress.MarqueeAnimationSpeed = 24;
        progress.Location = new Point(26, 108);
        progress.Size = new Size(405, 12);

        form.Controls.Add(title);
        form.Controls.Add(status);
        form.Controls.Add(progress);

        BackgroundWorker worker = new BackgroundWorker();
        worker.DoWork += delegate(object sender, DoWorkEventArgs args)
        {
            ProcessStartInfo info = new ProcessStartInfo();
            info.FileName = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "WindowsPowerShell\\v1.0\\powershell.exe");
            info.Arguments = "-NoProfile -ExecutionPolicy Bypass -File \"" + script + "\"";
            info.WorkingDirectory = root;
            info.UseShellExecute = false;
            info.CreateNoWindow = true;
            info.WindowStyle = ProcessWindowStyle.Hidden;
            info.RedirectStandardOutput = true;
            info.RedirectStandardError = true;
            using (Process process = Process.Start(info))
            {
                string stdout = process.StandardOutput.ReadToEnd();
                string stderr = process.StandardError.ReadToEnd();
                process.WaitForExit();
                args.Result = new InstallResult(process.ExitCode, stderr, stdout);
            }
        };
        worker.RunWorkerCompleted += delegate(object sender, RunWorkerCompletedEventArgs args)
        {
            form.Close();
            if (args.Error != null)
            {
                MessageBox.Show("설치에 실패했습니다.\n" + args.Error.Message, "CALIBRA 설치 오류", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            InstallResult result = (InstallResult)args.Result;
            if (result.ExitCode != 0)
            {
                string detail = String.IsNullOrWhiteSpace(result.Error) ? result.Output : result.Error;
                if (detail.Length > 1800) detail = detail.Substring(detail.Length - 1800);
                MessageBox.Show("설치가 완료되지 않았습니다.\n\n" + detail, "CALIBRA 설치 오류", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            MessageBox.Show("설치가 완료되었습니다. 바탕화면의 " + appName + " 바로가기로 홈 화면을 열 수 있습니다.", appName + " 설치 완료", MessageBoxButtons.OK, MessageBoxIcon.Information);
        };
        worker.RunWorkerAsync();
        Application.Run(form);
    }

    private sealed class InstallResult
    {
        public readonly int ExitCode;
        public readonly string Error;
        public readonly string Output;
        public InstallResult(int exitCode, string error, string output)
        {
            ExitCode = exitCode;
            Error = error;
            Output = output;
        }
    }
}
